import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const artifact = await prisma.artifact.findUnique({
      where: { id },
      include: {
        ticket: {
          select: { userId: true },
        },
      },
    });

    if (!artifact || artifact.ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Prepare response based on artifact type
    let data: Buffer;
    if (artifact.type === 'COVER_LETTER_TXT') {
      data = Buffer.from(artifact.content || '', 'utf-8');
    } else {
      data = artifact.fileData as Buffer;
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': artifact.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${artifact.fileName}"`,
      },
    });
  } catch (error) {
    console.error('Download artifact error:', error);
    return NextResponse.json(
      { error: 'Failed to download artifact' },
      { status: 500 }
    );
  }
}

