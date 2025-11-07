import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTailoredCV, generateCoverLetter } from '@/lib/claude';
import { generateCVDocx, generateCVPdf, generateCoverLetterText } from '@/lib/document-generator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get ticket with job and user data
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        job: true,
        user: {
          select: {
            name: true,
            email: true,
            baseCV: true,
          },
        },
      },
    });

    if (!ticket || ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!ticket.user.baseCV) {
      return NextResponse.json(
        { error: 'No base CV found. Please upload your CV first.' },
        { status: 400 }
      );
    }

    // Get cover letter example from file system or use default
    const coverLetterExample = `Hey team,

I'm Guy :) 

I built business operations at Firebolt from zero, from forecasting and board reporting to cross-functional programs, PLG motion and AI automation from the ground up (LangChain and then AWS Bedrock).
Now I want to do it for Impala. I understand your space, have built these systems before, and possess technical depth most BizOps people lack. 

Will love to chat, CV attached.

Thanks,
Guy`;

    // Generate tailored CV
    const cvData = await generateTailoredCV(
      ticket.user.baseCV,
      ticket.job.description,
      ticket.job.title,
      ticket.job.company
    );

    // Generate cover letter
    const coverLetter = await generateCoverLetter(
      ticket.user.baseCV,
      ticket.job.description,
      ticket.job.title,
      ticket.job.company,
      ticket.user.name || 'User',
      coverLetterExample
    );

    // Generate documents
    const cvDocx = await generateCVDocx(
      ticket.user.name || 'User',
      ticket.user.email || '',
      cvData.sections
    );

    const cvPdf = await generateCVPdf(
      ticket.user.name || 'User',
      ticket.user.email || '',
      cvData.fullText
    );

    const coverLetterText = generateCoverLetterText(
      ticket.user.name || 'User',
      ticket.user.email || '',
      ticket.job.company,
      ticket.job.title,
      coverLetter
    );

    // Delete existing artifacts for this ticket
    await prisma.artifact.deleteMany({
      where: { ticketId: ticket.id },
    });

    // Save artifacts
    const artifacts = await prisma.$transaction([
      prisma.artifact.create({
        data: {
          ticketId: ticket.id,
          type: 'CV_DOCX',
          fileData: cvDocx,
          fileName: `${ticket.user.name?.replace(/\s+/g, '_')}_CV_${ticket.job.company}.docx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      }),
      prisma.artifact.create({
        data: {
          ticketId: ticket.id,
          type: 'CV_PDF',
          fileData: cvPdf,
          fileName: `${ticket.user.name?.replace(/\s+/g, '_')}_CV_${ticket.job.company}.pdf`,
          mimeType: 'application/pdf',
        },
      }),
      prisma.artifact.create({
        data: {
          ticketId: ticket.id,
          type: 'COVER_LETTER_TXT',
          content: coverLetterText,
          fileName: `${ticket.user.name?.replace(/\s+/g, '_')}_CoverLetter_${ticket.job.company}.txt`,
          mimeType: 'text/plain',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      artifacts: artifacts.map((a) => ({
        id: a.id,
        type: a.type,
        fileName: a.fileName,
      })),
    });
  } catch (error) {
    console.error('Generate artifacts error:', error);
    return NextResponse.json(
      { error: 'Failed to generate artifacts' },
      { status: 500 }
    );
  }
}

