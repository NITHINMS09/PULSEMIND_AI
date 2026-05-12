import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PulseMind AI database (Phase 2)...');

  // Clear existing data (reverse dependency order)
  await prisma.teamAvailability.deleteMany();
  await prisma.aIConfidenceScore.deleteMany();
  await prisma.resolutionConfirmation.deleteMany();
  await prisma.complaintMessage.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.sLARecord.deleteMany();
  await prisma.complaintAssignment.deleteMany();
  await prisma.routingRule.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.pollResponse.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.wellnessReport.deleteMany();
  await prisma.burnoutScore.deleteMany();
  await prisma.emotionScore.deleteMany();
  await prisma.resolutionHistory.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.systemSetting.deleteMany();

  const password = await argon2.hash('Demo@2024');

  // Organization
  const org = await prisma.organization.create({
    data: { name: 'Innovex Technologies', slug: 'innovex', industry: 'Technology', size: '200-500', address: '123 Innovation Drive, San Francisco, CA', website: 'https://innovex.tech' },
  });

  // Departments
  const depts = await Promise.all([
    prisma.department.create({ data: { name: 'Engineering', description: 'Software development team', organizationId: org.id } }),
    prisma.department.create({ data: { name: 'Sales', description: 'Revenue and partnerships', organizationId: org.id } }),
    prisma.department.create({ data: { name: 'Human Resources', description: 'People operations', organizationId: org.id } }),
    prisma.department.create({ data: { name: 'Operations', description: 'Business operations', organizationId: org.id } }),
  ]);

  // Users
  const users: any[] = [];
  const demoAccounts = [
    { email: 'admin@demo.pulsemind.ai', firstName: 'Alex', lastName: 'Morgan', role: 'SUPER_ADMIN', jobTitle: 'Chief People Officer', deptIdx: 2 },
    { email: 'hr@demo.pulsemind.ai', firstName: 'Sarah', lastName: 'Chen', role: 'HR_MANAGER', jobTitle: 'HR Director', deptIdx: 2 },
    { email: 'employee@demo.pulsemind.ai', firstName: 'James', lastName: 'Wilson', role: 'EMPLOYEE', jobTitle: 'Software Engineer', deptIdx: 0 },
  ];
  const moreEmployees = [
    { email: 'dev1@innovex.tech', firstName: 'Priya', lastName: 'Sharma', role: 'EMPLOYEE', jobTitle: 'Senior Developer', deptIdx: 0 },
    { email: 'dev2@innovex.tech', firstName: 'Michael', lastName: 'Brown', role: 'TEAM_MEMBER', jobTitle: 'Tech Lead', deptIdx: 0 },
    { email: 'dev3@innovex.tech', firstName: 'Emily', lastName: 'Davis', role: 'EMPLOYEE', jobTitle: 'Frontend Engineer', deptIdx: 0 },
    { email: 'dev4@innovex.tech', firstName: 'Raj', lastName: 'Patel', role: 'EMPLOYEE', jobTitle: 'Backend Engineer', deptIdx: 0 },
    { email: 'dev5@innovex.tech', firstName: 'Lisa', lastName: 'Wang', role: 'EMPLOYEE', jobTitle: 'QA Engineer', deptIdx: 0 },
    { email: 'sales1@innovex.tech', firstName: 'Tom', lastName: 'Anderson', role: 'TEAM_MEMBER', jobTitle: 'Sales Manager', deptIdx: 1 },
    { email: 'sales2@innovex.tech', firstName: 'Jessica', lastName: 'Martinez', role: 'EMPLOYEE', jobTitle: 'Account Executive', deptIdx: 1 },
    { email: 'sales3@innovex.tech', firstName: 'David', lastName: 'Kim', role: 'EMPLOYEE', jobTitle: 'Sales Rep', deptIdx: 1 },
    { email: 'sales4@innovex.tech', firstName: 'Amy', lastName: 'Taylor', role: 'EMPLOYEE', jobTitle: 'BDR', deptIdx: 1 },
    { email: 'hr1@innovex.tech', firstName: 'Nicole', lastName: 'Johnson', role: 'EMPLOYEE', jobTitle: 'HR Coordinator', deptIdx: 2 },
    { email: 'hr2@innovex.tech', firstName: 'Chris', lastName: 'Lee', role: 'EMPLOYEE', jobTitle: 'Recruiter', deptIdx: 2 },
    { email: 'ops1@innovex.tech', firstName: 'Daniel', lastName: 'Garcia', role: 'TEAM_MEMBER', jobTitle: 'Operations Manager', deptIdx: 3 },
    { email: 'ops2@innovex.tech', firstName: 'Karen', lastName: 'White', role: 'EMPLOYEE', jobTitle: 'Office Manager', deptIdx: 3 },
    { email: 'ops3@innovex.tech', firstName: 'Ryan', lastName: 'Thompson', role: 'EMPLOYEE', jobTitle: 'IT Support', deptIdx: 3 },
    { email: 'ops4@innovex.tech', firstName: 'Megan', lastName: 'Clark', role: 'EMPLOYEE', jobTitle: 'Finance Analyst', deptIdx: 3 },
    { email: 'ops5@innovex.tech', firstName: 'Kevin', lastName: 'Robinson', role: 'EMPLOYEE', jobTitle: 'Facilities Coordinator', deptIdx: 3 },
  ];

  for (const u of [...demoAccounts, ...moreEmployees]) {
    const user = await prisma.user.create({
      data: {
        email: u.email, password, firstName: u.firstName, lastName: u.lastName,
        role: u.role, jobTitle: u.jobTitle,
        accountStatus: 'APPROVED',
        employeeId: `EMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        experienceLevel: ['Junior', 'Mid', 'Senior', 'Lead'][Math.floor(Math.random() * 4)],
        branch: ['HQ San Francisco', 'New York Office', 'Austin Office'][Math.floor(Math.random() * 3)],
        organizationId: org.id, departmentId: depts[u.deptIdx].id,
        approvedAt: new Date(),
      },
    });
    users.push(user);
  }

  // ============================================
  // Phase 2: Teams
  // ============================================
  console.log('  📋 Creating teams...');

  const teamData = [
    { name: 'Technical Support', type: 'TECHNICAL', leadIdx: 4, memberIdxs: [4, 5, 6, 16], hours: ['09:00', '18:00'] },
    { name: 'HR Resolution', type: 'HR', leadIdx: 1, memberIdxs: [1, 12, 13], hours: ['09:00', '17:00'] },
    { name: 'Service Desk', type: 'SERVICE', leadIdx: 8, memberIdxs: [8, 9, 10], hours: ['08:00', '20:00'] },
    { name: 'Infrastructure Ops', type: 'INFRASTRUCTURE', leadIdx: 14, memberIdxs: [14, 15, 18], hours: ['08:00', '18:00'] },
    { name: 'Management Review', type: 'MANAGEMENT', leadIdx: 0, memberIdxs: [0, 1, 14], hours: ['09:00', '17:00'] },
  ];

  const teams: any[] = [];
  for (const td of teamData) {
    const team = await prisma.team.create({
      data: {
        name: td.name, type: td.type, organizationId: org.id,
        leadId: users[td.leadIdx].id, maxCapacity: 20,
        operatingHoursStart: td.hours[0], operatingHoursEnd: td.hours[1], timezone: 'America/Los_Angeles',
      },
    });
    teams.push(team);

    // Add members
    for (const mIdx of td.memberIdxs) {
      await prisma.teamMember.create({
        data: { teamId: team.id, userId: users[mIdx].id, role: mIdx === td.leadIdx ? 'LEAD' : 'MEMBER' },
      });
    }
  }

  // ============================================
  // Phase 2: Routing Rules
  // ============================================
  console.log('  🔀 Creating routing rules...');

  const routingRulesData = [
    { teamIdx: 0, name: 'Tech Issues', keywords: ['system error', 'login problem', 'software bug', 'website issue', 'api failure', 'server down', 'database', 'password reset', 'crash', 'deploy'] },
    { teamIdx: 1, name: 'HR Matters', keywords: ['salary', 'payroll', 'leave request', 'policy violation', 'harassment', 'promotion', 'appraisal', 'benefits', 'termination', 'discrimination'] },
    { teamIdx: 2, name: 'Service Issues', keywords: ['customer complaint', 'service failure', 'billing issue', 'refund', 'onboarding', 'delivery', 'quality', 'support ticket'] },
    { teamIdx: 3, name: 'Facilities', keywords: ['internet down', 'hardware issue', 'electricity', 'office facility', 'printer', 'vpn', 'wifi', 'air conditioning', 'desk', 'building'] },
    { teamIdx: 4, name: 'Leadership', keywords: ['leadership', 'strategy', 'budget', 'headcount', 'performance review', 'conflict', 'culture', 'restructuring'] },
  ];

  for (const rr of routingRulesData) {
    await prisma.routingRule.create({
      data: { teamId: teams[rr.teamIdx].id, name: rr.name, keywords: JSON.stringify(rr.keywords), weight: 1.0, priority: 0 },
    });
  }

  // ============================================
  // Feedback + Complaints + Phase 2 records
  // ============================================
  console.log('  💬 Creating feedback and complaints...');

  const categories = ['COMPLAINT', 'SUGGESTION', 'SATISFACTION', 'WELLNESS', 'TOXICITY', 'WORKPLACE_SAFETY', 'HR_POLICY', 'TECHNICAL'];
  const emotions = ['frustration', 'anger', 'satisfaction', 'motivation', 'anxiety', 'neutral', 'positive'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const moods = ['😢', '😟', '😐', '🙂', '😄'];

  const feedbackTemplates = [
    { title: 'Workload concerns', content: 'The workload has been increasing significantly over the past month. I feel overwhelmed with the number of tasks assigned.' },
    { title: 'Great team collaboration', content: 'Really happy with how the team has been working together on the latest project. Communication is excellent.' },
    { title: 'Office environment issues', content: 'The air conditioning in the third floor has been broken for weeks. It makes it very difficult to concentrate.' },
    { title: 'Career growth opportunities', content: 'I would love to see more training programs and mentorship opportunities for junior developers.' },
    { title: 'Manager communication', content: 'My manager rarely provides feedback on my work. I feel disconnected from team goals and expectations.' },
    { title: 'Deadline pressure', content: 'The constant tight deadlines are causing significant stress. We need more realistic project timelines.' },
    { title: 'Recognition needed', content: 'Our team shipped a major feature last sprint but received no acknowledgment from leadership.' },
    { title: 'Work-life balance', content: 'I appreciate the flexible work policy. It has greatly improved my productivity and mental health.' },
    { title: 'Tooling improvements', content: 'Our development tools are outdated. Upgrading to modern CI/CD would save hours of manual work weekly.' },
    { title: 'Harassment concern', content: 'I witnessed inappropriate behavior during the team dinner. This needs to be addressed by HR immediately.' },
  ];

  const complaintStatuses = ['SUBMITTED', 'AI_PROCESSING', 'AI_RESPONDED', 'HUMAN_TEAM_ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'ESCALATED', 'REOPENED', 'RESOLVED', 'CLOSED'];
  const complaints: any[] = [];

  for (let i = 0; i < 50; i++) {
    const tpl = feedbackTemplates[i % feedbackTemplates.length];
    const user = users[Math.floor(Math.random() * users.length)];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = ['SUBMITTED', 'PENDING', 'IN_REVIEW', 'RESOLVED', 'ESCALATED'][Math.floor(Math.random() * 5)];
    const sentiment = emotion === 'satisfaction' || emotion === 'motivation' || emotion === 'positive' ? 0.3 + Math.random() * 0.7 : -0.8 + Math.random() * 0.6;
    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000);

    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id, category: cat, priority, title: `${tpl.title} #${i + 1}`,
        content: tpl.content, departmentId: user.departmentId,
        starRating: Math.floor(Math.random() * 5) + 1, moodEmoji: moods[Math.floor(Math.random() * 5)],
        stressLevel: Math.floor(Math.random() * 10), satisfactionScore: Math.floor(Math.random() * 100),
        keywords: JSON.stringify(['workload', 'team', 'management'].slice(0, Math.floor(Math.random() * 3) + 1)),
        language: 'en', status, createdAt,
      },
    });

    await prisma.aIAnalysis.create({
      data: {
        feedbackId: feedback.id, emotion, sentiment, toxicityScore: Math.random() * 0.3,
        urgency: priority, summary: `AI analysis: ${tpl.content.slice(0, 80)}...`,
        keywords: JSON.stringify(['communication', 'workload', 'management']),
        recommendations: JSON.stringify(['Follow up within 48 hours', 'Review team workload']),
      },
    });

    await prisma.emotionScore.create({
      data: { userId: user.id, feedbackId: feedback.id, emotion, score: Math.abs(sentiment), confidence: 0.7 + Math.random() * 0.25 },
    });

    // AI Confidence Score (Phase 2)
    const overallConf = 40 + Math.random() * 55;
    await prisma.aIConfidenceScore.create({
      data: {
        feedbackId: feedback.id,
        overallScore: overallConf,
        classificationScore: 50 + Math.random() * 45,
        sentimentScore: 60 + Math.random() * 35,
        routingScore: 30 + Math.random() * 60,
        resolutionScore: 20 + Math.random() * 60,
        routingRecommendation: teams[Math.floor(Math.random() * teams.length)].name,
        classificationResult: cat,
        requiresHuman: overallConf < 60,
        humanEscalationReason: overallConf < 60 ? 'AI confidence below threshold' : null,
      },
    });

    // Create complaints for complaint-type feedback
    if (['COMPLAINT', 'TOXICITY', 'WORKPLACE_SAFETY'].includes(cat)) {
      const cStatusIdx = Math.floor(Math.random() * complaintStatuses.length);
      const cStatus = complaintStatuses[cStatusIdx];
      const isResolved = cStatus === 'RESOLVED';
      const isClosed = cStatus === 'CLOSED';
      const teamIdx = Math.floor(Math.random() * teams.length);

      const complaint = await prisma.complaint.create({
        data: {
          feedbackId: feedback.id, authorId: user.id,
          status: cStatus, priority,
          escalationLevel: cStatus === 'ESCALATED' ? Math.floor(Math.random() * 3) + 1 : 0,
          reopenCount: cStatus === 'REOPENED' ? Math.floor(Math.random() * 3) + 1 : 0,
          resolvedAt: isResolved ? new Date() : null,
          closedAt: isClosed ? new Date() : null,
          createdAt,
        },
      });
      complaints.push(complaint);

      // Create assignment (Phase 2)
      if (!['SUBMITTED', 'AI_PROCESSING', 'AI_RESPONDED'].includes(cStatus)) {
        const memberUser = users[teamData[teamIdx].memberIdxs[Math.floor(Math.random() * teamData[teamIdx].memberIdxs.length)]];
        await prisma.complaintAssignment.create({
          data: {
            complaintId: complaint.id, teamId: teams[teamIdx].id,
            assigneeId: memberUser.id, assignedBy: users[0].id,
            note: 'Auto-assigned by routing engine',
          },
        });
      }

      // Create SLA record (Phase 2)
      const slaHours: Record<string, number[]> = { LOW: [24, 72], MEDIUM: [8, 48], HIGH: [4, 24], CRITICAL: [1, 4] };
      const [respH, resH] = slaHours[priority] || [8, 48];
      const respDeadline = new Date(createdAt.getTime() + respH * 3600000);
      const resDeadline = new Date(createdAt.getTime() + resH * 3600000);
      const isResponseBreached = isResolved || Math.random() > 0.7;
      const isResolutionBreached = isResolved ? Math.random() > 0.6 : Math.random() > 0.8;

      await prisma.sLARecord.create({
        data: {
          complaintId: complaint.id, priority,
          responseDeadline: respDeadline, resolutionDeadline: resDeadline,
          firstResponseAt: ['SUBMITTED', 'AI_PROCESSING'].includes(cStatus) ? null : new Date(createdAt.getTime() + Math.random() * respH * 3600000),
          resolvedAt: isResolved ? new Date() : null,
          isResponseBreached, isResolutionBreached,
          responseBreachedAt: isResponseBreached ? respDeadline : null,
          resolutionBreachedAt: isResolutionBreached ? resDeadline : null,
        },
      });

      // Create escalation records (Phase 2)
      if (cStatus === 'ESCALATED') {
        const escLevel = complaint.escalationLevel || 1;
        for (let lvl = 1; lvl <= escLevel; lvl++) {
          await prisma.escalation.create({
            data: {
              complaintId: complaint.id,
              fromLevel: lvl - 1, toLevel: lvl,
              reason: lvl === 1 ? 'SLA response breach — auto-escalated' : 'Manual escalation by team lead',
              triggeredBy: lvl === 1 ? 'SLA_AUTO' : 'MANUAL',
              triggeredById: users[0].id,
              note: `Escalated to level ${lvl}`,
              createdAt: new Date(createdAt.getTime() + lvl * 3600000),
            },
          });
        }
      }

      // Resolution confirmations (Phase 2)
      if (isResolved) {
        await prisma.resolutionConfirmation.create({
          data: {
            complaintId: complaint.id, employeeId: user.id,
            decision: 'ACCEPTED',
            satisfactionRating: Math.floor(Math.random() * 3) + 3,
            professionalismRating: ['YES', 'SOMEWHAT', 'YES'][Math.floor(Math.random() * 3)],
            comment: 'Thank you for resolving this quickly.',
            attemptNumber: 1,
          },
        });
      }

      // Chat messages (Phase 2)
      if (!['SUBMITTED', 'AI_PROCESSING'].includes(cStatus)) {
        const msgCount = Math.floor(Math.random() * 4) + 1;
        for (let m = 0; m < msgCount; m++) {
          const isEmployee = m % 2 === 0;
          const msgSender = isEmployee ? user : users[teamData[teamIdx].memberIdxs[0]];
          const msgs = isEmployee
            ? ['Can you provide more details about when this started?', 'I have attached the error log for reference.', 'How long will this take to resolve?']
            : ['We are looking into this issue. Thank you for reporting.', 'Our team has identified the root cause.', 'A fix has been deployed. Please verify.'];

          await prisma.complaintMessage.create({
            data: {
              complaintId: complaint.id,
              senderId: msgSender.id,
              senderType: isEmployee ? 'EMPLOYEE' : 'TEAM',
              content: msgs[m % msgs.length],
              messageType: 'TEXT',
              createdAt: new Date(createdAt.getTime() + (m + 1) * 1800000),
            },
          });
        }
      }
    }
  }

  // Burnout scores for all users
  for (const user of users) {
    const score = Math.floor(Math.random() * 80) + 10;
    await prisma.burnoutScore.create({
      data: {
        userId: user.id, score,
        riskLevel: score > 75 ? 'CRITICAL' : score > 55 ? 'HIGH' : score > 35 ? 'MODERATE' : 'LOW',
        factors: JSON.stringify(['workload', 'deadlines', 'communication'].slice(0, Math.floor(Math.random() * 3) + 1)),
        recommendations: JSON.stringify(['Take regular breaks', 'Discuss workload with manager']),
      },
    });

    await prisma.wellnessReport.create({
      data: {
        userId: user.id, overallScore: 100 - score,
        stressScore: score, satisfactionScore: 100 - score * 0.8,
        engagementScore: 50 + Math.random() * 40, period: 'weekly',
        recommendations: JSON.stringify(['Stay active', 'Connect with colleagues']),
      },
    });
  }

  // Badges
  const badges = await Promise.all([
    prisma.badge.create({ data: { name: 'First Submission', description: 'Submitted your first feedback', icon: '🎯', criteria: 'Submit 1 feedback' } }),
    prisma.badge.create({ data: { name: '10-Day Streak', description: '10 consecutive days of engagement', icon: '🔥', criteria: '10 day streak' } }),
    prisma.badge.create({ data: { name: 'Constructive Contributor', description: 'Submitted 10+ constructive feedbacks', icon: '⭐', criteria: '10 positive feedbacks' } }),
    prisma.badge.create({ data: { name: 'Team Player', description: 'Helped resolve 5 complaints', icon: '🤝', criteria: 'Resolve 5 complaints' } }),
  ]);

  for (let i = 0; i < Math.min(10, users.length); i++) {
    await prisma.userBadge.create({ data: { userId: users[i].id, badgeId: badges[i % badges.length].id } });
  }

  // Notifications
  for (const user of users.slice(0, 5)) {
    await prisma.notification.create({ data: { userId: user.id, type: 'AI_INSIGHT', title: 'New AI Insight Available', body: 'Your recent feedback has been analyzed. View your wellness recommendations.' } });
    await prisma.notification.create({ data: { userId: user.id, type: 'STATUS_UPDATE', title: 'Feedback Status Updated', body: 'Your feedback has been reviewed by the HR team.', isRead: true } });
  }

  // Team availability
  for (const td of teamData) {
    for (const mIdx of td.memberIdxs) {
      await prisma.teamAvailability.create({
        data: { teamId: teams[teamData.indexOf(td)].id, memberId: users[mIdx].id, status: Math.random() > 0.3 ? 'ONLINE' : 'AWAY' },
      });
    }
  }

  console.log('✅ Phase 2 seed data created successfully!');
  console.log(`   📊 ${complaints.length} complaints with SLA records, assignments, and chat threads`);
  console.log(`   🏢 ${teams.length} teams with ${routingRulesData.length} routing rules`);
  console.log('\n📧 Demo Credentials:');
  console.log('  Employee:    employee@demo.pulsemind.ai / Demo@2024');
  console.log('  HR Manager:  hr@demo.pulsemind.ai / Demo@2024');
  console.log('  Super Admin: admin@demo.pulsemind.ai / Demo@2024\n');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
