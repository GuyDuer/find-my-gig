import { NextResponse } from 'next/server';
import { sendDailyDigest } from '@/lib/email-service';

export const maxDuration = 60; // 1 minute max execution time

export async function GET() {
  console.log('=== Starting daily digest send ===');

  try {
    const result = await sendDailyDigest();

    if (result.success) {
      console.log(`✓ Digest sent successfully with ${result.jobsSent} jobs`);
      return NextResponse.json({
        success: true,
        message: result.jobsSent > 0 
          ? `Digest sent with ${result.jobsSent} jobs`
          : 'No new jobs to send',
        jobsSent: result.jobsSent,
      });
    } else {
      console.error(`✗ Failed to send digest: ${result.error}`);
      return NextResponse.json({
        success: false,
        error: result.error,
        jobsSent: result.jobsSent,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Fatal error in send-digest endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

