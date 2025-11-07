import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseDocxToText } from '@/lib/cv-parser';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Only DOCX files are supported' },
        { status: 400 }
      );
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse DOCX to text
    const text = await parseDocxToText(buffer);

    // Update user with CV data
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        baseCV: text,
        baseCVDocx: buffer,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'CV uploaded successfully',
      preview: text.substring(0, 500) + '...',
    });
  } catch (error) {
    console.error('CV upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload CV' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { baseCV: true },
    });

    if (!user?.baseCV) {
      return NextResponse.json(
        { error: 'No CV found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cv: user.baseCV,
    });
  } catch (error) {
    console.error('CV fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CV' },
      { status: 500 }
    );
  }
}

