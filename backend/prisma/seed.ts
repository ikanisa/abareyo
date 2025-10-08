import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.info('Seeding Rayon Sports base data...');

  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPasswordHash = process.env.ADMIN_SEED_PASSWORD_HASH;
  const adminDisplayName = process.env.ADMIN_SEED_NAME ?? 'System Admin';

  const defaultPermissionKeys = [
    'match:create',
    'match:update',
    'match:delete',
    'ticket:price:update',
    'ticket:order:view',
    'ticket:order:refund',
    'ticket:order:resend',
    'order:shop:update',
    'order:shop:view',
    'order:donation:export',
    'order:donation:view',
    'sms:attach',
    'sms:retry',
    'sms:view',
    'sms:parser:update',
    'gate:update',
    'membership:plan:create',
    'membership:plan:update',
    'membership:member:update',
    'product:crud',
    'inventory:adjust',
    'fundraising:project:update',
    'community:post:schedule',
    'post:moderate',
    'content:page:publish',
    'ussd:template:update',
    'admin:user:crud',
    'admin:role:assign',
    'admin:permission:update',
    'audit:view',
    'featureflag:update',
    'translation:update',
    'report:download',
  ];

  await Promise.all(
    defaultPermissionKeys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key },
      }),
    ),
  );

  const systemAdminRole = await prisma.adminRole.upsert({
    where: { name: 'SYSTEM_ADMIN' },
    update: {},
    create: {
      name: 'SYSTEM_ADMIN',
      description: 'Grants unrestricted access to all admin capabilities.',
    },
  });

  const permissions = await prisma.permission.findMany({
    where: { key: { in: defaultPermissionKeys } },
    select: { id: true, key: true },
  });

  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: systemAdminRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  if (adminEmail && adminPasswordHash) {
    const adminUser = await prisma.adminUser.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: {
        passwordHash: adminPasswordHash,
        displayName: adminDisplayName,
        status: 'active',
      },
      create: {
        email: adminEmail.toLowerCase(),
        passwordHash: adminPasswordHash,
        displayName: adminDisplayName,
      },
    });

    await prisma.adminUsersOnRoles.upsert({
      where: {
        adminUserId_roleId: {
          adminUserId: adminUser.id,
          roleId: systemAdminRole.id,
        },
      },
      update: {},
      create: {
        adminUserId: adminUser.id,
        roleId: systemAdminRole.id,
      },
    });
  } else {
    console.warn(
      'Skipping seeded admin user. Provide ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD_HASH to bootstrap a SYSTEM_ADMIN account.',
    );
  }

  const defaultPromptLabel = 'Default Parser v1';
  const prompt = await prisma.smsParserPrompt.upsert({
    where: { label: defaultPromptLabel },
    update: {},
    create: {
      label: defaultPromptLabel,
      body:
        'You interpret mobile money SMS receipts and extract normalized fields (amount, currency, payer mask, reference, timestamp) with a confidence score between 0 and 1. If a field is missing, provide a reasonable default and reduce confidence.',
      version: 1,
      isActive: true,
    },
  });

  await prisma.smsParserPrompt.updateMany({
    where: { id: { not: prompt.id } },
    data: { isActive: false },
  });

  await prisma.ussdTemplate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {
      body: '*182*7*1*{amount}#',
      telco: 'MTN',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      name: 'MTN Ticket Purchase',
      telco: 'MTN',
      body: '*182*7*1*{amount}#',
      variables: { placeholders: ['amount'] },
    },
  });

  await prisma.ussdTemplate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000202' },
    update: {
      body: '*500*9*{amount}#',
      telco: 'Airtel',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000202',
      name: 'Airtel Ticket Purchase',
      telco: 'Airtel',
      body: '*500*9*{amount}#',
      variables: { placeholders: ['amount'] },
    },
  });

  await prisma.match.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      opponent: 'APR FC',
      kickoff: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      venue: 'Kigali Stadium',
      status: 'scheduled',
      competition: 'Rwanda Premier League',
    },
  });

  await prisma.$transaction([
    prisma.membershipPlan.upsert({
      where: { slug: 'gikundiro-standard' },
      update: {},
      create: {
        slug: 'gikundiro-standard',
        name: 'Gikundiro+ Standard',
        price: 15000,
        perks: {
          perks: ['Early ticket window', 'Shop discount 5%', 'Monthly insider update'],
        },
      },
    }),
    prisma.membershipPlan.upsert({
      where: { slug: 'gikundiro-premium' },
      update: {},
      create: {
        slug: 'gikundiro-premium',
        name: 'Gikundiro+ Premium',
        price: 40000,
        perks: {
          perks: ['VIP hospitality', 'Exclusive merchandise drops', 'Invite-only events'],
        },
      },
    }),
  ]);

  await prisma.$transaction([
    prisma.fundProject.upsert({
      where: { title: 'Youth Academy Pitch' },
      update: {},
      create: {
        title: 'Youth Academy Pitch',
        description: 'Help us renovate the academy training ground and equip young players.',
        goal: 30000000,
        progress: 12000000,
        status: 'active',
        coverImage: '/images/fundraising/academy.jpg',
      },
    }),
    prisma.fundProject.upsert({
      where: { title: 'Community CSR Kits' },
      update: {},
      create: {
        title: 'Community CSR Kits',
        description: 'Provide kits to community teams across Rwanda.',
        goal: 10000000,
        progress: 3500000,
        status: 'active',
        coverImage: '/images/fundraising/csr.jpg',
      },
    }),
  ]);

  await prisma.product.upsert({
    where: { slug: 'home-jersey-2025' },
    update: {},
    create: {
      name: 'Home Jersey 2025',
      slug: 'home-jersey-2025',
      price: 25000,
      stock: 500,
      images: { main: '/images/shop/home-jersey-2025.png' },
      category: 'jerseys',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'away-jersey-2025' },
    update: {},
    create: {
      name: 'Away Jersey 2025',
      slug: 'away-jersey-2025',
      price: 25000,
      stock: 450,
      images: { main: '/images/shop/away-jersey-2025.png' },
      category: 'jerseys',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'training-kit' },
    update: {},
    create: {
      name: 'Training Kit',
      slug: 'training-kit',
      price: 18000,
      stock: 300,
      images: { main: '/images/shop/training-kit.png' },
      category: 'training',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'rayon-scarf' },
    update: {},
    create: {
      name: 'Rayon Sports Scarf',
      slug: 'rayon-scarf',
      price: 8000,
      stock: 600,
      images: { main: '/images/shop/scarf.png' },
      category: 'accessories',
    },
  });


  console.info('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
