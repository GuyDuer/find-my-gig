/**
 * Email Service
 * Handles email notifications via Resend
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@findmygig.com';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export interface DailyDigestData {
  userName: string;
  newTickets: Array<{
    id: string;
    jobTitle: string;
    company: string;
    overallScore: number;
    tags: string[];
  }>;
  summary: {
    totalNew: number;
    highFitCount: number;
    avgScore: number;
  };
}

/**
 * Send daily digest email
 */
export async function sendDailyDigest(
  userEmail: string,
  data: DailyDigestData
): Promise<void> {
  const { userName, newTickets, summary } = data;

  const ticketRows = newTickets
    .map(
      (ticket) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${ticket.jobTitle}</strong><br/>
        <span style="color: #6b7280;">${ticket.company}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="
          background: ${ticket.overallScore >= 80 ? '#22c55e' : ticket.overallScore >= 70 ? '#3b82f6' : '#6b7280'};
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: bold;
        ">${Math.round(ticket.overallScore)}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${ticket.tags.map((tag) => `<span style="background: #f3f4f6; padding: 2px 8px; border-radius: 8px; font-size: 12px; margin-right: 4px;">${tag}</span>`).join('')}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <a href="${APP_URL}/dashboard/tickets/${ticket.id}" style="
          background: #3b82f6;
          color: white;
          padding: 6px 16px;
          border-radius: 6px;
          text-decoration: none;
          display: inline-block;
        ">View</a>
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Job Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; color: white;">
    <h1 style="margin: 0 0 10px 0;">🎯 Daily Job Digest</h1>
    <p style="margin: 0; opacity: 0.9;">Hey ${userName}, here are your new opportunities!</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; text-align: center;">
      <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${summary.totalNew}</div>
        <div style="color: #6b7280; font-size: 14px;">New Jobs</div>
      </div>
      <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 32px; font-weight: bold; color: #22c55e;">${summary.highFitCount}</div>
        <div style="color: #6b7280; font-size: 14px;">High Fit</div>
      </div>
      <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 32px; font-weight: bold; color: #8b5cf6;">${Math.round(summary.avgScore)}</div>
        <div style="color: #6b7280; font-size: 14px;">Avg Score</div>
      </div>
    </div>

    ${
      newTickets.length > 0
        ? `
    <h2 style="margin-top: 30px; color: #1f2937;">New Opportunities</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Job</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Score</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Tags</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${ticketRows}
      </tbody>
    </table>
    `
        : '<p style="text-align: center; color: #6b7280; padding: 40px;">No new jobs found today. We\'ll keep looking!</p>'
    }

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <a href="${APP_URL}/dashboard" style="
        background: #3b82f6;
        color: white;
        padding: 12px 32px;
        border-radius: 6px;
        text-decoration: none;
        display: inline-block;
        font-weight: 600;
      ">View Dashboard</a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p>Want to pause notifications? <a href="${APP_URL}/dashboard/settings" style="color: #3b82f6;">Manage your settings</a></p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `🎯 Daily Digest: ${summary.totalNew} new job${summary.totalNew !== 1 ? 's' : ''} found`,
      html,
    });
  } catch (error) {
    console.error('Error sending daily digest:', error);
    throw error;
  }
}

/**
 * Send high-fit job notification
 */
export async function sendHighFitNotification(
  userEmail: string,
  userName: string,
  ticket: {
    id: string;
    jobTitle: string;
    company: string;
    overallScore: number;
    tags: string[];
  }
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>High Fit Job Alert</title>
</head>
<body style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <div style="background: #22c55e; padding: 20px; border-radius: 10px; color: white; text-align: center;">
    <h1 style="margin: 0;">🎉 High Fit Job Alert!</h1>
  </div>
  
  <div style="padding: 30px; background: white; border: 1px solid #e5e7eb; border-top: none;">
    <p>Hey ${userName},</p>
    <p>We found a job that's a great match for you:</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="margin: 0 0 10px 0; color: #1f2937;">${ticket.jobTitle}</h2>
      <p style="color: #6b7280; margin: 0 0 15px 0;">${ticket.company}</p>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span style="background: #22c55e; color: white; padding: 6px 16px; border-radius: 12px; font-weight: bold;">
          ${Math.round(ticket.overallScore)} Score
        </span>
        ${ticket.tags.map((tag) => `<span style="background: #e5e7eb; padding: 4px 12px; border-radius: 8px; font-size: 14px;">${tag}</span>`).join('')}
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${APP_URL}/dashboard/tickets/${ticket.id}" style="
        background: #3b82f6;
        color: white;
        padding: 12px 32px;
        border-radius: 6px;
        text-decoration: none;
        display: inline-block;
        font-weight: 600;
      ">View Job & Apply</a>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `🎉 High Fit Alert: ${ticket.jobTitle} at ${ticket.company}`,
      html,
    });
  } catch (error) {
    console.error('Error sending high-fit notification:', error);
    throw error;
  }
}

