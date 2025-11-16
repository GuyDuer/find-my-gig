import { Resend } from 'resend';
import { supabaseAdmin } from './supabase';
import { format } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  matchScore: number;
  keySkills: string[];
}

/**
 * Generate HTML email template
 */
function generateEmailHTML(jobs: EmailJob[], date: string): string {
  const jobsHTML = jobs.map(job => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px;">
        <div>
          <a href="${job.url}" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${job.title}
          </a>
          <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">
            ${job.company}${job.location ? ` • ${job.location}` : ''}
          </div>
          ${job.keySkills.length > 0 ? `
            <div style="margin-top: 8px;">
              ${job.keySkills.slice(0, 3).map(skill => `
                <span style="background-color: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px; display: inline-block; margin-top: 4px;">
                  ${skill}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </td>
      <td style="padding: 16px; text-align: center;">
        <span style="background-color: ${job.matchScore >= 80 ? '#10b981' : job.matchScore >= 60 ? '#3b82f6' : '#6b7280'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">
          ${job.matchScore}%
        </span>
      </td>
      <td style="padding: 16px; text-align: right;">
        <a href="${job.url}" style="background-color: #2563eb; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; display: inline-block;">
          View Job
        </a>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Job Matches - ${date}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #111827; font-size: 24px;">
                🎯 New Job Matches
              </h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                ${date}
              </p>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f3f4f6;">
              <p style="margin: 0; color: #374151; font-size: 16px;">
                Found <strong>${jobs.length} new relevant job${jobs.length !== 1 ? 's' : ''}</strong> matching your profile
              </p>
            </td>
          </tr>

          <!-- Jobs Table -->
          <tr>
            <td style="padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${jobsHTML}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; display: inline-block; font-weight: 600;">
                View All Jobs
              </a>
              <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">
                You're receiving this because you set up Find My Gig job alerts
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send daily digest email
 */
export async function sendDailyDigest(): Promise<{ success: boolean; error?: string; jobsSent: number }> {
  try {
    const emailTo = process.env.EMAIL_TO;
    
    if (!emailTo) {
      console.error('EMAIL_TO environment variable not set');
      return { success: false, error: 'Email address not configured', jobsSent: 0 };
    }

    // Get jobs from the last 24 hours that are relevant
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        url,
        location,
        first_seen_at,
        companies:company_id (
          name
        ),
        job_scores!inner (
          is_relevant,
          match_score,
          key_skills_matched
        )
      `)
      .eq('status', 'active')
      .eq('job_scores.is_relevant', true)
      .gte('first_seen_at', oneDayAgo)
      .order('job_scores.match_score', { ascending: false });

    if (jobsError) {
      console.error('Error fetching jobs for digest:', jobsError);
      return { success: false, error: jobsError.message, jobsSent: 0 };
    }

    if (!jobs || jobs.length === 0) {
      console.log('No new relevant jobs to send');
      // Log that we sent no jobs
      await supabaseAdmin
        .from('email_digests')
        .insert({
          sent_at: new Date().toISOString(),
          jobs_included: [],
          status: 'sent',
        });
      
      return { success: true, jobsSent: 0 };
    }

    // Format jobs for email
    const emailJobs: EmailJob[] = jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.companies?.name || 'Unknown',
      location: job.location,
      url: job.url,
      matchScore: job.job_scores?.[0]?.match_score || 0,
      keySkills: job.job_scores?.[0]?.key_skills_matched || [],
    }));

    const today = format(new Date(), 'MMMM d, yyyy');
    const html = generateEmailHTML(emailJobs, today);

    // Send email
    const { data, error: sendError } = await resend.emails.send({
      from: 'Find My Gig <onboarding@resend.dev>', // Update with your verified domain
      to: emailTo,
      subject: `🎯 ${emailJobs.length} New Job Match${emailJobs.length !== 1 ? 'es' : ''} - ${today}`,
      html,
    });

    if (sendError) {
      console.error('Error sending email:', sendError);
      
      // Log failed send
      await supabaseAdmin
        .from('email_digests')
        .insert({
          sent_at: new Date().toISOString(),
          jobs_included: emailJobs.map(j => j.id),
          status: 'failed',
          error_message: sendError.message,
        });
      
      return { success: false, error: sendError.message, jobsSent: emailJobs.length };
    }

    console.log(`Email sent successfully to ${emailTo} with ${emailJobs.length} jobs`);

    // Log successful send
    await supabaseAdmin
      .from('email_digests')
      .insert({
        sent_at: new Date().toISOString(),
        jobs_included: emailJobs.map(j => j.id),
        status: 'sent',
      });

    return { success: true, jobsSent: emailJobs.length };
  } catch (error: any) {
    console.error('Fatal error sending digest:', error);
    return { success: false, error: error.message, jobsSent: 0 };
  }
}

