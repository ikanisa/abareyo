import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.info('Seeding Rayon Sports base data...');

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
