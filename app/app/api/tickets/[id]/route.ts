import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['IDENTIFIED', 'SUBMITTED', 'REJECTED', 'WONT_GO_AFTER']).optional(),
  applicationMethod: z.string().optional(),
  snoozedUntil: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        job: true,
        artifacts: {
          select: {
            id: true,
            type: true,
            fileName: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket || ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Fetch ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    // Verify ownership
    const existing = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: any = { ...validatedData };

    // If status is being changed to SUBMITTED, record submission timestamp
    if (validatedData.status === 'SUBMITTED' && existing.status !== 'SUBMITTED') {
      updateData.submittedAt = new Date();
    }

    // Handle snooze
    if (validatedData.snoozedUntil) {
      updateData.snoozedUntil = new Date(validatedData.snoozedUntil);
    }

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        job: true,
        artifacts: true,
      },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

