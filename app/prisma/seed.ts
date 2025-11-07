import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@findmygig.com' },
    update: {},
    create: {
      name: 'Guy Duer',
      email: 'demo@findmygig.com',
      password: hashedPassword,
      baseCV: `Guy Duer
demo@findmygig.com

PROFESSIONAL SUMMARY
Strategic Business Operations leader with 5+ years of experience building and scaling operations at high-growth tech startups. Proven track record in RevOps, financial planning, cross-functional program management, and AI automation implementation.

EXPERIENCE

Head of Business Operations | Firebolt | 2020-2024
• Built business operations from zero, establishing forecasting models and board reporting processes
• Led cross-functional programs and implemented PLG motion
• Developed AI automation systems using LangChain and AWS Bedrock
• Managed budgeting, financial operations, and investor relations
• Improved organizational efficiency through strategic planning and process optimization

Business Operations Manager | Previous Company | 2018-2020
• Managed legal, compliance, and contractual workflows
• Led strategic initiatives across business, market, and capital dimensions
• Streamlined operations and improved team productivity
• Implemented tools and processes to enhance workflow efficiency

EDUCATION
MBA, Business Administration | Top University | 2018
Bachelor of Science, Engineering | University | 2014

SKILLS
Business Operations, Revenue Operations, Financial Planning & Analysis, Strategic Planning, Cross-functional Leadership, AI & Automation (LangChain, AWS Bedrock), Process Optimization, Data Analysis, Stakeholder Management, Legal & Compliance`,
    },
  });

  console.log('✓ Created demo user:', demoUser.email);

  // Create scan config
  const scanConfig = await prisma.scanConfig.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      enabled: true,
      threshold: 65,
      timezone: 'Asia/Jerusalem',
    },
  });

  console.log('✓ Created scan config');

  // Create preference sets
  const prefSet1 = await prisma.userPreferenceSet.create({
    data: {
      userId: demoUser.id,
      name: 'Primary Search - RevOps/BizOps',
      active: true,
      roles: ['RevOps', 'BizOps', 'Strategy & Ops'],
      locations: ['Israel', 'Remote'],
      companies: ['Impala', 'Firebolt', 'Google', 'Meta'],
    },
  });

  const prefSet2 = await prisma.userPreferenceSet.create({
    data: {
      userId: demoUser.id,
      name: 'Alternative - Chief of Staff',
      active: true,
      roles: ['Chief of Staff', 'GTM Ops'],
      locations: ['Israel', 'Tel Aviv'],
      companies: [],
    },
  });

  console.log('✓ Created preference sets');

  // Create sample job
  const sampleJob = await prisma.job.create({
    data: {
      title: 'Head of Business Operations',
      company: 'Impala AI',
      description: `Join Impala AI, an innovative startup building a fully-managed LLM-inference platform, that enables data heavy enterprises to perform any AI task at any scale without limits.

We're looking for a Head of Business Operations to partner closely with our CEO and leadership team. This is a strategic and hands-on role at the intersection of legal, finance, and strategy.

What You'll Do:
• Lead and optimize Impala's business operations, including legal, finance, and strategic planning.
• Work on strategical initiatives from business, market, and capital.
• Oversee financial operations - budgeting, forecasting, and investor reporting ensuring alignment and definition of business objectives

What You'll Bring:
• 5+ years of experience in business operations, finance, or strategy within a high-growth tech or startup environment.
• Proven track record in managing cross-functional initiatives and improving organizational efficiency.
• Experience handling legal, compliance, and contractual workflows.
• Strong organizational skills with the ability to manage multiple projects simultaneously
• Analytical mindset and keen attention to detail, capable of breaking down complex challenges into actionable steps.
• Adaptability and a proactive approach to problem-solving in a dynamic environment.
• Ability to work independently with minimal supervision, while maintaining strong team alignment.
• Tech-savvy, curious, and comfortable adopting new tools to streamline workflows and enhance productivity.`,
      descriptionHash: '1234567890abcdef',
      url: 'https://example.com/jobs/impala-bizops',
      locations: ['Tel Aviv', 'Israel'],
      roleTags: ['BizOps', 'Strategy & Ops'],
      workMode: 'Hybrid',
      postingDate: new Date(),
      source: 'Demo',
      active: true,
    },
  });

  console.log('✓ Created sample job');

  // Create sample ticket
  const sampleTicket = await prisma.ticket.create({
    data: {
      userId: demoUser.id,
      jobId: sampleJob.id,
      status: 'IDENTIFIED',
      userToJobScore: 92,
      jobToUserScore: 95,
      overallScore: 93.2,
      scoringExplanation: `User→Job Fit (92/100): Excellent match. The candidate has directly relevant experience as Head of Business Operations at a tech startup, with proven expertise in financial planning, legal/compliance workflows, and cross-functional program management. The AI automation experience (LangChain, AWS Bedrock) is particularly relevant to Impala's AI-focused mission. Strong organizational and analytical skills align perfectly with the role requirements.

Job→User Fit (95/100): Outstanding match. The role is at a high-interest company (Impala), in the preferred location (Israel), and matches the primary role preferences (BizOps, Strategy & Ops). The startup environment and AI focus align with the candidate's background and interests.

Overall Score: 93.2 - This is an exceptional match worth prioritizing.`,
      tags: ["You're a High Fit!", "They're a High Fit for you!", "That's a Match!"],
    },
  });

  console.log('✓ Created sample ticket');

  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Demo user credentials:');
  console.log('Email: demo@findmygig.com');
  console.log('Password: password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

