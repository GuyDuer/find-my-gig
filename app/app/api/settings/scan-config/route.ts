import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  threshold: z.number().min(0).max(100).optional(),
  snoozeUntil: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scanConfig = await prisma.scanConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!scanConfig) {
      // Create default config if doesn't exist
      const newConfig = await prisma.scanConfig.create({
        data: {
          userId: session.user.id,
          enabled: true,
          threshold: 65,
          timezone: 'Asia/Jerusalem',
        },
      });
      return NextResponse.json({ scanConfig: newConfig });
    }

    return NextResponse.json({ scanConfig });
  } catch (error) {
    console.error('Fetch scan config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan configuration' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    const updateData: any = { ...validatedData };

    // Handle snooze
    if (validatedData.snoozeUntil !== undefined) {
      updateData.snoozeUntil = validatedData.snoozeUntil
        ? new Date(validatedData.snoozeUntil)
        : null;
    }

    const scanConfig = await prisma.scanConfig.update({
      where: { userId: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ scanConfig });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update scan config error:', error);
    return NextResponse.json(
      { error: 'Failed to update scan configuration' },
      { status: 500 }
    );
  }
}

