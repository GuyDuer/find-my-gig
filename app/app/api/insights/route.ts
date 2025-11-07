import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // New roles today
    const newRolesToday = await prisma.ticket.count({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
    });

    // Average fit score (last 7 days)
    const recentTickets = await prisma.ticket.findMany({
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        overallScore: true,
      },
    });

    const avgFit7Days =
      recentTickets.length > 0
        ? recentTickets.reduce((sum, t) => sum + t.overallScore, 0) / recentTickets.length
        : 0;

    // Top companies (last 7 days)
    const ticketsWithJobs = await prisma.ticket.findMany({
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        job: {
          select: {
            company: true,
          },
        },
      },
    });

    const companyCount: Record<string, number> = {};
    ticketsWithJobs.forEach((t) => {
      const company = t.job.company;
      companyCount[company] = (companyCount[company] || 0) + 1;
    });

    const topCompanies = Object.entries(companyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));

    // Top titles (≥80 avg fit)
    const highFitTickets = await prisma.ticket.findMany({
      where: {
        userId,
        overallScore: {
          gte: 80,
        },
      },
      include: {
        job: {
          select: {
            title: true,
            roleTags: true,
          },
        },
      },
    });

    const titleScores: Record<string, { total: number; count: number }> = {};
    highFitTickets.forEach((t) => {
      const title = t.job.title;
      if (!titleScores[title]) {
        titleScores[title] = { total: 0, count: 0 };
      }
      titleScores[title].total += t.overallScore;
      titleScores[title].count += 1;
    });

    const topTitles = Object.entries(titleScores)
      .map(([title, { total, count }]) => ({
        title,
        avgScore: total / count,
        count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // Status distribution
    const statusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      where: {
        userId,
        archivedAt: null,
      },
      _count: {
        status: true,
      },
    });

    const statusDistribution = statusCounts.map((s) => ({
      status: s.status,
      count: s._count.status,
    }));

    // Recent activity (last 7 days by day)
    const dailyTickets = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await prisma.ticket.count({
        where: {
          userId,
          createdAt: {
            gte: day,
            lt: nextDay,
          },
        },
      });

      dailyTickets.push({
        date: day.toISOString().split('T')[0],
        count,
      });
    }

    return NextResponse.json({
      newRolesToday,
      avgFit7Days: Math.round(avgFit7Days * 10) / 10,
      topCompanies,
      topTitles,
      statusDistribution,
      dailyTickets,
    });
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

