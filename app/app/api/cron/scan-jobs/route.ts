import { NextRequest, NextResponse } from 'next/server';
import { scanJobsForAllUsers } from '@/lib/job-scanner';
import { prisma } from '@/lib/prisma';
import { sendDailyDigest } from '@/lib/email';

/**
 * Cron job endpoint for daily job scanning
 * Should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 * 
 * Secure this endpoint in production with:
 * - Vercel Cron Secret
 * - API Key authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Optional: Verify cron secret
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run job scan
    const scanResult = await scanJobsForAllUsers();

    // Send daily digests to users with new tickets
    const users = await prisma.user.findMany({
      where: {
        scanConfig: { enabled: true },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const digestResults = [];

    for (const user of users) {
      try {
        // Get tickets created in the last 24 hours
        const newTickets = await prisma.ticket.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          include: {
            job: true,
          },
          orderBy: {
            overallScore: 'desc',
          },
        });

        if (newTickets.length > 0 && user.email) {
          const highFitCount = newTickets.filter((t) => t.overallScore >= 80).length;
          const avgScore =
            newTickets.reduce((sum, t) => sum + t.overallScore, 0) / newTickets.length;

          await sendDailyDigest(user.email, {
            userName: user.name || 'User',
            newTickets: newTickets.map((t) => ({
              id: t.id,
              jobTitle: t.job.title,
              company: t.job.company,
              overallScore: t.overallScore,
              tags: t.tags,
            })),
            summary: {
              totalNew: newTickets.length,
              highFitCount,
              avgScore,
            },
          });

          // Create digest notification
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'DAILY_DIGEST',
              title: 'Daily Digest Sent',
              message: `${newTickets.length} new job${newTickets.length !== 1 ? 's' : ''} in your digest`,
              data: {
                ticketCount: newTickets.length,
              },
            },
          });

          digestResults.push({
            userId: user.id,
            email: user.email,
            ticketsSent: newTickets.length,
            success: true,
          });
        }
      } catch (error) {
        console.error(`Error sending digest to user ${user.id}:`, error);
        digestResults.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      scan: scanResult,
      digests: digestResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}

