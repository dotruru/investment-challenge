import { PrismaClient, ProfileType, StageType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();
const generateAccessCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: 'System Admin',
      role: 'admin',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create operator user
  const operatorPassword = await bcrypt.hash('operator123', 10);
  const operator = await prisma.adminUser.upsert({
    where: { email: 'operator@example.com' },
    update: {},
    create: {
      email: 'operator@example.com',
      passwordHash: operatorPassword,
      name: 'Event Operator',
      role: 'operator',
    },
  });
  console.log('✅ Created operator user:', operator.email);

  // Create sample event
  const event = await prisma.event.create({
    data: {
      name: 'UK Investment Challenge 2024',
      date: new Date('2024-06-15T09:00:00Z'),
      venue: 'London, UK',
      status: 'DRAFT',
    },
  });
  console.log('✅ Created event:', event.name);

  // Create default stages
  const stages = [
    { title: 'Doors Open', stageType: StageType.LOBBY, orderIndex: 0 },
    { title: 'Team Card Wall', stageType: StageType.LOBBY_CARD_GRID, orderIndex: 1 },
    { title: 'Welcome', stageType: StageType.WELCOME, orderIndex: 2 },
    { title: 'Jury Reveal', stageType: StageType.JURY_REVEAL, orderIndex: 3 },
    { title: 'Round 1', stageType: StageType.ROUND, orderIndex: 4, configuration: { roundNumber: 1 } },
    { title: 'Break 1', stageType: StageType.BREAK, orderIndex: 5, configuration: { duration: 15 } },
    { title: 'Round 2', stageType: StageType.ROUND, orderIndex: 6, configuration: { roundNumber: 2 } },
    { title: 'Break 2', stageType: StageType.BREAK, orderIndex: 7, configuration: { duration: 15 } },
    { title: 'Keynote Speaker', stageType: StageType.KEYNOTE, orderIndex: 8 },
    { title: 'Round 3', stageType: StageType.ROUND, orderIndex: 9, configuration: { roundNumber: 3 } },
    { title: 'Keynote Speaker 2', stageType: StageType.KEYNOTE, orderIndex: 10 },
    { title: 'Awards Ceremony', stageType: StageType.AWARDS, orderIndex: 11 },
    { title: 'Networking', stageType: StageType.NETWORKING, orderIndex: 12 },
  ];

  for (const stage of stages) {
    await prisma.eventStage.create({
      data: {
        eventId: event.id,
        title: stage.title,
        stageType: stage.stageType,
        orderIndex: stage.orderIndex,
        configuration: stage.configuration || {},
      },
    });
  }
  console.log('✅ Created', stages.length, 'stages');

  // Create sample teams
  const teams = [
    { name: 'Alpha Capital', university: 'Oxford University', round: 1 },
    { name: 'Beta Investments', university: 'Cambridge University', round: 1 },
    { name: 'Gamma Fund', university: 'LSE', round: 1 },
    { name: 'Delta Partners', university: 'Imperial College', round: 1 },
    { name: 'Epsilon Holdings', university: 'UCL', round: 1 },
    { name: 'Zeta Ventures', university: 'King\'s College', round: 2 },
    { name: 'Eta Capital', university: 'Warwick University', round: 2 },
    { name: 'Theta Fund', university: 'Manchester University', round: 2 },
    { name: 'Iota Investments', university: 'Edinburgh University', round: 2 },
    { name: 'Kappa Partners', university: 'Durham University', round: 2 },
    { name: 'Lambda Holdings', university: 'Bristol University', round: 3 },
    { name: 'Mu Ventures', university: 'Bath University', round: 3 },
    { name: 'Nu Capital', university: 'Exeter University', round: 3 },
    { name: 'Xi Fund', university: 'York University', round: 3 },
    { name: 'Omicron Investments', university: 'Sheffield University', round: 3 },
  ];

  for (const team of teams) {
    const createdTeam = await prisma.team.create({
      data: {
        eventId: event.id,
        name: team.name,
        university: team.university,
        roundAssignment: team.round,
        status: 'APPROVED',
        strategyTagline: `Quantitative approach to ${['growth', 'value', 'momentum', 'income', 'ESG'][Math.floor(Math.random() * 5)]} investing`,
        stats: {
          performance: (Math.random() * 30 - 5).toFixed(2),
          sharpe: (Math.random() * 2 + 0.5).toFixed(2),
          sortino: (Math.random() * 3 + 0.5).toFixed(2),
        },
      },
    });

    // Add team members
    const members = ['Portfolio Manager', 'Risk Analyst', 'Research Lead'];
    for (let i = 0; i < 3; i++) {
      await prisma.teamMember.create({
        data: {
          teamId: createdTeam.id,
          name: `${['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey'][Math.floor(Math.random() * 5)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
          role: members[i],
          displayOrder: i,
        },
      });
    }
  }
  console.log('✅ Created', teams.length, 'teams with members');

  // Create jury members
  const juryMembers = [
    { name: 'Dr. Sarah Chen', role: 'Managing Director', company: 'Goldman Sachs' },
    { name: 'James Williams', role: 'Partner', company: 'Bridgewater Associates' },
    { name: 'Elena Rossi', role: 'Chief Investment Officer', company: 'BlackRock' },
    { name: 'Michael Brown', role: 'Head of Equities', company: 'Fidelity' },
    { name: 'Amanda Taylor', role: 'Portfolio Manager', company: 'Renaissance Technologies' },
  ];

  for (const jury of juryMembers) {
    const profile = await prisma.personProfile.create({
      data: {
        eventId: event.id,
        name: jury.name,
        role: jury.role,
        company: jury.company,
        profileType: ProfileType.JURY,
        bioShort: `${jury.role} at ${jury.company} with 15+ years of experience in investment management.`,
      },
    });

    await prisma.juryAuth.create({
      data: {
        juryId: profile.id,
        accessCode: generateAccessCode(),
      },
    });
  }
  console.log('✅ Created', juryMembers.length, 'jury members');

  // Create hosts
  const hosts = [
    { name: 'David Moore', role: 'Master of Ceremonies' },
    { name: 'Sophie Anderson', role: 'Co-host' },
  ];

  for (const host of hosts) {
    await prisma.personProfile.create({
      data: {
        eventId: event.id,
        name: host.name,
        role: host.role,
        profileType: ProfileType.HOST,
      },
    });
  }
  console.log('✅ Created', hosts.length, 'hosts');

  // Create scoring criteria
  const criteria = [
    { name: 'Investment Thesis Quality', description: 'Clarity and strength of the investment idea', weight: 1.5 },
    { name: 'Risk Management', description: 'Identification and mitigation of risks', weight: 1.2 },
    { name: 'Presentation Skills', description: 'Communication and delivery', weight: 1.0 },
    { name: 'Q&A Performance', description: 'Ability to handle questions', weight: 1.0 },
    { name: 'Innovation', description: 'Creativity and uniqueness of approach', weight: 0.8 },
  ];

  for (let i = 0; i < criteria.length; i++) {
    await prisma.scoringCriteria.create({
      data: {
        eventId: event.id,
        name: criteria[i].name,
        description: criteria[i].description,
        maxScore: 10,
        weight: criteria[i].weight,
        displayOrder: i,
      },
    });
  }
  console.log('✅ Created', criteria.length, 'scoring criteria');

  // Create live state
  await prisma.liveState.create({
    data: {
      eventId: event.id,
      timerState: { type: 'presentation', status: 'idle', durationMs: 0, serverStartTime: 0 },
      animationState: { currentAnimation: null, step: 0, totalSteps: 0 },
      roundState: { currentRound: 0, teamOrder: [], currentTeamIndex: 0, teamsCompleted: [] },
    },
  });
  console.log('✅ Created live state');

  // Print jury access codes
  console.log('\n📋 Jury Access Codes:');
  const juryWithCodes = await prisma.personProfile.findMany({
    where: { eventId: event.id, profileType: ProfileType.JURY },
    include: { juryAuth: true },
  });
  juryWithCodes.forEach((j) => {
    console.log(`   ${j.name}: ${j.juryAuth?.accessCode}`);
  });

  console.log('\n✨ Seeding complete!');
  console.log('\n📝 Login Credentials:');
  console.log('   Admin: admin@example.com / admin123');
  console.log('   Operator: operator@example.com / operator123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

