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
  const operatorPassword = await bcrypt.hash('operator0000', 10);
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
      name: 'UK University Investment Competition 2025',
      date: new Date('2025-12-05T09:00:00Z'),
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

  // Create actual teams from the competition with photos
  const teams = [
    {
      name: 'ACSL Veterans',
      university: 'Amsterdam',
      round: 1,
      logo: null,
      members: [
        { name: 'David Dragichi', photo: '/assets/DATAROOM/TEAMS/1. ACSL VETERANS (Amsterdam)/David Dragichi.jpg' },
        { name: 'Nicolae Darie-Nistor', photo: '/assets/DATAROOM/TEAMS/1. ACSL VETERANS (Amsterdam)/Nicolae Darie-Nistor.jpg' },
        { name: 'Robert Jacob Oros', photo: '/assets/DATAROOM/TEAMS/1. ACSL VETERANS (Amsterdam)/Robert Jacob Oros.jpg' },
      ],
      stats: { performance: -6.13, sharpe: -6.37, volatility: 13.55 },
    },
    {
      name: 'Dalio Lama',
      university: 'Bath',
      round: 1,
      logo: '/assets/DATAROOM/TEAMS/2. DALIO LAMA (Bath)/Dalio_Lama_logo.png',
      members: [
        { name: 'Daksh', photo: '/assets/DATAROOM/TEAMS/2. DALIO LAMA (Bath)/Daksh_photo.jpg' },
        { name: 'Nag', photo: '/assets/DATAROOM/TEAMS/2. DALIO LAMA (Bath)/Nag_photo.jpg' },
        { name: 'Keshav Iyer', photo: '/assets/DATAROOM/TEAMS/2. DALIO LAMA (Bath)/Keshav Iyer.png' },
      ],
      stats: { performance: 4.02, sharpe: 2.17, volatility: 32.09 },
    },
    {
      name: 'Black Swan Capital',
      university: 'Exeter',
      round: 1,
      logo: '/assets/DATAROOM/TEAMS/3. BLACK SWAN CAPITAL (Exeter)/black swan logo.png',
      members: [
        { name: 'Benji Crawford', photo: '/assets/DATAROOM/TEAMS/3. BLACK SWAN CAPITAL (Exeter)/WhatsApp Image 2025-12-03 at 15.30.31_182630f9.jpg' },
        { name: 'Robert Zhulyev', photo: '/assets/DATAROOM/TEAMS/3. BLACK SWAN CAPITAL (Exeter)/WhatsApp Image 2025-12-03 at 16.55.55_06e17c3e.jpg' },
        { name: 'Andrei Khristoliubov', photo: '/assets/DATAROOM/TEAMS/3. BLACK SWAN CAPITAL (Exeter)/WhatsApp Image 2025-12-03 at 17.10.17_872a4821.jpg' },
      ],
      stats: { performance: 1.90, sharpe: null, volatility: 0.90 },
    },
    {
      name: 'Platypus Partners',
      university: 'Imperial',
      round: 1,
      logo: '/assets/DATAROOM/TEAMS/4. PLATYPUS PARTNERS (Imperial)/Platypus Logo.png',
      members: [
        { name: 'Adam Hrehovcik', photo: '/assets/DATAROOM/TEAMS/4. PLATYPUS PARTNERS (Imperial)/Adam Hrehovcik.JPG' },
        { name: 'Joaquim Silva', photo: '/assets/DATAROOM/TEAMS/4. PLATYPUS PARTNERS (Imperial)/Joaquim Silva.jpg' },
      ],
      stats: { performance: 4.10, sharpe: 1.46, volatility: 21.30 },
    },
    {
      name: 'HMC Capital',
      university: "King's",
      round: 1,
      logo: '/assets/DATAROOM/TEAMS/5. HMC CAPITAL (King_s)/HMC Capital - Logo.png',
      members: [
        { name: 'Can Berk Ican', photo: '/assets/DATAROOM/TEAMS/5. HMC CAPITAL (King_s)/Can Berk Ican.jpg' },
        { name: 'Hugo Raffard', photo: '/assets/DATAROOM/TEAMS/5. HMC CAPITAL (King_s)/Hugo Raffard.png' },
        { name: 'Murathan Berk Afacan', photo: '/assets/DATAROOM/TEAMS/5. HMC CAPITAL (King_s)/Murathan Berk Afacan.jpg' },
      ],
      stats: { performance: 4.86, sharpe: 4.3, volatility: 9.14 },
    },
    {
      name: 'Mirage Capital',
      university: 'Lancaster',
      round: 2,
      logo: '/assets/DATAROOM/TEAMS/6. MIRAGE CAPITAL (Lancaster)/Mirage Capital logo.jpeg',
      members: [
        { name: 'Elsa Mhangami', photo: '/assets/DATAROOM/TEAMS/6. MIRAGE CAPITAL (Lancaster)/Elsa Mhangami.jpg' },
        { name: 'Maryam Jaouad', photo: '/assets/DATAROOM/TEAMS/6. MIRAGE CAPITAL (Lancaster)/Maryam Jaouad.jpeg' },
        { name: 'Mohammed Rayan Jaouad', photo: '/assets/DATAROOM/TEAMS/6. MIRAGE CAPITAL (Lancaster)/Mohammed Rayan Jaouad.jpeg' },
      ],
      stats: { performance: null, sharpe: 1.28, volatility: null },
    },
    {
      name: 'Rory Tomlinson',
      university: 'Loughborough',
      round: 2,
      logo: '/assets/DATAROOM/TEAMS/7. RORY (Loughborough)/Logo.png',
      members: [
        { name: 'Rory Tomlinson', photo: '/assets/DATAROOM/TEAMS/7. RORY (Loughborough)/Rory Tomlinson.jpg' },
      ],
      stats: { performance: 2.88, sharpe: 1.32, volatility: 17.10 },
    },
    {
      name: 'Solo Yolo',
      university: 'LSE',
      round: 2,
      logo: null,
      members: [
        { name: 'Thomson Chua', photo: '/assets/DATAROOM/TEAMS/8. SOLO YOLO (LSE)/Thomson Chua.jpeg' },
      ],
      stats: { performance: 2.26, sharpe: null, volatility: 27.90 },
    },
    {
      name: 'LockedIn',
      university: 'Manchester',
      round: 2,
      logo: '/assets/DATAROOM/TEAMS/9. LOCKEDIN (Manchester)/LockedIn Logo.jpeg',
      members: [
        { name: 'Jaime Sancho', photo: '/assets/DATAROOM/TEAMS/9. LOCKEDIN (Manchester)/Jaime Sancho.jpeg' },
        { name: 'Sidhanth Srikanth', photo: '/assets/DATAROOM/TEAMS/9. LOCKEDIN (Manchester)/Sidhanth Srikanth.jpeg' },
        { name: 'Vadim Voloshin', photo: '/assets/DATAROOM/TEAMS/9. LOCKEDIN (Manchester)/Vadim Voloshin.jpeg' },
      ],
      stats: { performance: -1.10, sharpe: null, volatility: null },
    },
    {
      name: 'Robin Hood Capital',
      university: 'Nottingham',
      round: 2,
      logo: '/assets/DATAROOM/TEAMS/10. ROBIN HOOD CAPITAL (Nottingham)/Robin Hood Capital Logo.png',
      members: [
        { name: 'Josh Groves', photo: '/assets/DATAROOM/TEAMS/10. ROBIN HOOD CAPITAL (Nottingham)/Josh Groves.jpeg' },
        { name: 'Kabir Siddhu', photo: '/assets/DATAROOM/TEAMS/10. ROBIN HOOD CAPITAL (Nottingham)/Kabir Siddhu.jpeg' },
        { name: 'Muzamel Shah', photo: '/assets/DATAROOM/TEAMS/10. ROBIN HOOD CAPITAL (Nottingham)/Muzamel Shah.jpeg' },
      ],
      stats: { performance: null, sharpe: null, volatility: null },
    },
    {
      name: 'Canonical',
      university: 'Queen Mary',
      round: 3,
      logo: '/assets/DATAROOM/TEAMS/11. CANONICAL (Queen Mary)/canonicallogo.png',
      members: [
        { name: 'Jamie Jia Jing Teh', photo: '/assets/DATAROOM/TEAMS/11. CANONICAL (Queen Mary)/Jamie Jia Jing Teh.png' },
        { name: 'Mehmet John Evans', photo: '/assets/DATAROOM/TEAMS/11. CANONICAL (Queen Mary)/Mehmet John Evans.png' },
        { name: 'Shivesh Lochunah', photo: '/assets/DATAROOM/TEAMS/11. CANONICAL (Queen Mary)/Shivesh Lochunah.png' },
      ],
      stats: { performance: 2.32, sharpe: 1.63, volatility: 15.10 },
    },
    {
      name: 'Barestone Capital',
      university: 'SEO',
      round: 3,
      logo: '/assets/DATAROOM/TEAMS/12. BARESTONE CAPITAL (SEO)/Barestone Capital Logo.png',
      members: [
        { name: 'Rohan Joseph', photo: '/assets/DATAROOM/TEAMS/12. BARESTONE CAPITAL (SEO)/Rohan Joseph.jpg' },
      ],
      stats: { performance: 1.20, sharpe: 0.44, volatility: 12.74 },
    },
    {
      name: 'Blackshard',
      university: 'UCL',
      round: 3,
      logo: '/assets/DATAROOM/TEAMS/13. BLACKSHARD (UCL)/blackshard_logo.png',
      members: [
        { name: 'Aran Grant', photo: '/assets/DATAROOM/TEAMS/13. BLACKSHARD (UCL)/Aran Grant.jpg' },
        { name: 'Sujay Aggarwal', photo: '/assets/DATAROOM/TEAMS/13. BLACKSHARD (UCL)/Sujay Aggarwal.jpg' },
        { name: 'Sushant Shyam', photo: '/assets/DATAROOM/TEAMS/13. BLACKSHARD (UCL)/Sushant Shyam.jpg' },
      ],
      stats: { performance: 3.91, sharpe: 0.9, volatility: 26.40 },
    },
    {
      name: 'Sapiens',
      university: 'Warwick',
      round: 3,
      logo: null,
      members: [
        { name: 'David Labella', photo: '/assets/DATAROOM/TEAMS/14. SAPIENS (Warwick)/David Labella.jpg' },
        { name: 'Manraj Singh', photo: '/assets/DATAROOM/TEAMS/14. SAPIENS (Warwick)/Manraj Singh.JPG' },
        { name: 'Tariq Howlader', photo: '/assets/DATAROOM/TEAMS/14. SAPIENS (Warwick)/Tariq Howlader.jpg' },
      ],
      stats: { performance: 0.90, sharpe: 0.042, volatility: 12.69 },
    },
    {
      name: 'HAD Capital',
      university: 'Independent',
      round: 3,
      logo: null,
      members: [
        { name: 'Arjun Juneja', photo: '/assets/DATAROOM/TEAMS/15. HAD CAPITAL (Independent)/Arjun Juneja.jpeg' },
        { name: 'Dhriti Pareek', photo: '/assets/DATAROOM/TEAMS/15. HAD CAPITAL (Independent)/Dhriti Pareek.jpeg' },
        { name: 'Hashim Ahmed', photo: '/assets/DATAROOM/TEAMS/15. HAD CAPITAL (Independent)/Hashim Ahmed.jpeg' },
      ],
      stats: { performance: 6.50, sharpe: 1.18, volatility: 30.0 },
    },
  ];

  for (const team of teams) {
    const createdTeam = await prisma.team.create({
      data: {
        eventId: event.id,
        name: team.name,
        university: team.university,
        roundAssignment: team.round,
        status: 'APPROVED',
        avatarCardImageUrl: team.logo,
        strategyTagline: `Investment strategy from ${team.university}`,
        stats: team.stats,
      },
    });

    // Add team members with photos
    for (let i = 0; i < team.members.length; i++) {
      await prisma.teamMember.create({
        data: {
          teamId: createdTeam.id,
          name: team.members[i].name,
          photoUrl: team.members[i].photo,
          role: i === 0 ? 'Team Member' : 'Team Member',
          displayOrder: i,
        },
      });
    }
  }
  console.log('✅ Created', teams.length, 'teams with members and photos');

  // Create jury members
  const juryMembers = [
    {
      name: 'Tom Jemmett',
      role: 'Head of Authorised Funds',
      company: 'LGT Wealth Management',
      bio: 'Tom is Head of Authorised Funds at LGT Wealth Management, chairing both the Authorised Collectives and Investment Trust Committees.',
      photoUrl: '/assets/DATAROOM/SPEAKERS-HOSTS/JURY/Tom Jemmett/face.png',
    },
    {
      name: 'Christoph Pfundstein',
      role: 'Founder',
      company: 'Golborne Capital',
      bio: 'Christoph worked 14 years at Goldman Sachs. In 2024, he founded Goldborne Capital for asset-backed lending across Europe.',
      photoUrl: '/assets/DATAROOM/SPEAKERS-HOSTS/JURY/Christoph Pfundstein/face.png',
    },
    {
      name: 'David Kettle',
      role: 'Proprietary Trader',
      company: 'Volcafe',
      bio: 'David worked at Volcafe proprietary trading for two years. Previously eight years at Marex and six at Macquarie. First class MORSE degree from Warwick.',
      photoUrl: '/assets/DATAROOM/SPEAKERS-HOSTS/JURY/David Kettle/face.png',
    },
  ];

  for (const jury of juryMembers) {
    const profile = await prisma.personProfile.create({
      data: {
        eventId: event.id,
        name: jury.name,
        role: jury.role,
        company: jury.company,
        profileType: ProfileType.JURY,
        bioShort: jury.bio,
        photoUrl: jury.photoUrl,
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
    {
      name: 'Giorgio Toledo',
      role: 'Co-Founder',
      company: 'MCD Edu',
      bio: 'Giorgio is committed to closing the gap between employers and graduates through more effective, experience-based recruitment.',
      photoUrl: '/assets/DATAROOM/SPEAKERS-HOSTS/HOSTS /Giorgio Toledo/face.jpg',
    },
    {
      name: 'Dr. Luba Schoenig',
      role: 'Co-Founder',
      company: 'UMushroom',
      bio: "Luba holds a Master's degree in Economics from the University of Fribourg and a PhD in Quantitative Finance from the University of Zurich.",
      photoUrl: '/assets/DATAROOM/SPEAKERS-HOSTS/HOSTS /Dr. Luba Schoenig /face.jpg',
    },
  ];

  for (const host of hosts) {
    await prisma.personProfile.create({
      data: {
        eventId: event.id,
        name: host.name,
        role: host.role,
        company: host.company,
        profileType: ProfileType.HOST,
        bioShort: host.bio,
        photoUrl: host.photoUrl,
      },
    });
  }
  console.log('✅ Created', hosts.length, 'hosts');

  // Create speakers
  const speakers = [
    {
      name: 'Ashley Oerth',
      role: 'Senior Investment Strategist',
      company: 'Invesco',
      bio: 'Ashley Oerth is a Senior Investment Strategist for the Global Market Strategy team at Invesco.',
      photoUrl: '/assets/DATAROOM/SPEAKERS-HOSTS/SPEAKERS/1. Ashley Oerth, CFA/face.jpg',
    },
    {
      name: 'Supriya Menon',
      role: 'Managing Director, Head of Multi-Asset Strategy EMEA',
      company: 'Wellington Management',
      bio: 'Started in macro research at Morgan Stanley and Lehman Brothers, built multi-asset expertise at Aviva and Pictet.',
      photoUrl: '/assets/DATAROOM/SPEAKERS-HOSTS/SPEAKERS/2. Supriya Menon/face.jpg',
    },
  ];

  for (const speaker of speakers) {
    await prisma.personProfile.create({
      data: {
        eventId: event.id,
        name: speaker.name,
        role: speaker.role,
        company: speaker.company,
        profileType: ProfileType.SPEAKER,
        bioShort: speaker.bio,
        photoUrl: speaker.photoUrl,
      },
    });
  }
  console.log('✅ Created', speakers.length, 'speakers');

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
  console.log('   Operator PIN: 0000');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
