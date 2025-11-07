import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const preferenceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  active: z.boolean().default(true),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  locations: z.array(z.string()).min(1, 'At least one location is required'),
  companies: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.userPreferenceSet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Fetch preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = preferenceSchema.parse(body);

    // Check if user already has 3 preference sets
    const count = await prisma.userPreferenceSet.count({
      where: { userId: session.user.id },
    });

    if (count >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 preference sets allowed' },
        { status: 400 }
      );
    }

    const preference = await prisma.userPreferenceSet.create({
      data: {
        userId: session.user.id,
        ...validatedData,
      },
    });

    return NextResponse.json({ preference }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create preference error:', error);
    return NextResponse.json(
      { error: 'Failed to create preference set' },
      { status: 500 }
    );
  }
}

