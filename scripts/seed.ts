import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import type { Database } from '../src/integrations/supabase/types';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to run the seed script');
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const makeId = () => randomUUID();

async function main() {
  await seedUsers();
  await seedMatches();
  await seedTicketOrdersAndTickets();
  await seedProducts();
  await seedFanClubs();
  await seedPolls();
  await seedQuotesAndPolicies();
  await seedSaccoDeposits();
  await seedFanPosts();
  await seedTransactions();
  console.log('Seed completed');
}

async function seedUsers() {
  const users = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Emmanuel Niyonsenga',
      phone: '+250780000101',
      momo_number: '+250780000101',
      tier: 'gold' as const,
      points: 1200,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Alice Uwimana',
      phone: '+250780000102',
      momo_number: '+250780000102',
      tier: 'fan' as const,
      points: 650,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Didier Mugisha',
      phone: '+250780000103',
      momo_number: '+250780000103',
      tier: 'fan' as const,
      points: 420,
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Sandrine Iradukunda',
      phone: '+250780000104',
      momo_number: '+250780000104',
      tier: 'guest' as const,
      points: 180,
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Patrick Ndoli',
      phone: '+250780000105',
      momo_number: '+250780000105',
      tier: 'gold' as const,
      points: 980,
    },
  ];

  await supabase.from('users').upsert(users as any, { onConflict: 'phone' });

  const wallets = users.map((user, index) => ({
    id: makeId(),
    user_id: user.id,
    balance: 50000 - index * 5000,
  }));
  for (const wallet of wallets) {
    await supabase.from('wallet').upsert(wallet as any, { onConflict: 'user_id' });
  }
}

async function seedMatches() {
  const now = new Date();
  const matches = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Rayon vs APR',
      comp: 'Rwandan Premier League',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Kigali Stadium',
      status: 'upcoming' as const,
      home_team: 'Rayon Sports',
      away_team: 'APR FC',
      vip_price: 25000,
      regular_price: 12000,
      blue_price: 6000,
      seats_vip: 120,
      seats_regular: 1200,
      seats_blue: 500,
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      title: 'Rayon vs Police',
      comp: 'Peace Cup',
      date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      venue: 'Amahoro Stadium',
      status: 'live' as const,
      home_team: 'Rayon Sports',
      away_team: 'Police FC',
      vip_price: 20000,
      regular_price: 10000,
      blue_price: 5000,
      seats_vip: 90,
      seats_regular: 800,
      seats_blue: 400,
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      title: 'Rayon vs Marines',
      comp: 'Premier League',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Bugesera Stadium',
      status: 'ft' as const,
      home_team: 'Rayon Sports',
      away_team: 'Marines FC',
      vip_price: 18000,
      regular_price: 8000,
      blue_price: 4000,
      seats_vip: 70,
      seats_regular: 700,
      seats_blue: 350,
    },
  ];

  await supabase.from('matches').upsert(matches as any, { onConflict: 'id' });
}

async function seedTicketOrdersAndTickets() {
  const orders = [
    {
      id: 'order-1',
      user_id: '11111111-1111-1111-1111-111111111111',
      match_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      total: 50000,
      momo_ref: 'MOMO-ORDER-1',
      status: 'paid' as const,
      ussd_code: '*182*8*1*001#',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'order-2',
      user_id: '22222222-2222-2222-2222-222222222222',
      match_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      total: 20000,
      momo_ref: 'MOMO-ORDER-2',
      status: 'pending' as const,
      ussd_code: '*182*8*1*002#',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
  ];

  for (const order of orders) {
    await supabase.from('ticket_orders').upsert(order as any, { onConflict: 'id' });
  }

  const items = [
    { id: 'order-item-1', order_id: 'order-1', zone: 'VIP' as const, quantity: 2, price: 25000 },
    { id: 'order-item-2', order_id: 'order-2', zone: 'Regular' as const, quantity: 2, price: 10000 },
  ];

  for (const item of items) {
    await supabase.from('ticket_order_items').upsert(item as any, { onConflict: 'id' });
  }

  const tickets = [
    {
      id: 'ticket-1',
      order_id: 'order-1',
      user_id: '11111111-1111-1111-1111-111111111111',
      match_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      zone: 'VIP' as const,
      price: 25000,
      paid: true,
      momo_ref: 'MOMO-ORDER-1',
      gate: 'A',
      state: 'active',
      qr_token: 'QR-TICKET-1',
    },
    {
      id: 'ticket-2',
      order_id: 'order-1',
      user_id: '11111111-1111-1111-1111-111111111111',
      match_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      zone: 'VIP' as const,
      price: 25000,
      paid: true,
      momo_ref: 'MOMO-ORDER-1',
      gate: 'A',
      state: 'active',
      qr_token: 'QR-TICKET-2',
    },
    {
      id: 'ticket-3',
      order_id: 'order-2',
      user_id: '22222222-2222-2222-2222-222222222222',
      match_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      zone: 'Regular' as const,
      price: 10000,
      paid: false,
      momo_ref: 'MOMO-ORDER-2',
      gate: 'C',
      state: 'pending',
      qr_token: 'QR-TICKET-3',
    },
    {
      id: 'ticket-4',
      order_id: 'order-2',
      user_id: '22222222-2222-2222-2222-222222222222',
      match_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      zone: 'Regular' as const,
      price: 10000,
      paid: false,
      momo_ref: 'MOMO-ORDER-2',
      gate: 'C',
      state: 'pending',
      qr_token: 'QR-TICKET-4',
    },
  ];

  for (const ticket of tickets) {
    await supabase.from('tickets').upsert(ticket as any, { onConflict: 'id' });
  }
}

async function seedProducts() {
  const products = Array.from({ length: 10 }).map((_, index) => ({
    id: `prod-${index + 1}`,
    name: index % 2 === 0 ? `Rayon Jersey ${index + 1}` : `Training Gear ${index + 1}`,
    category: index % 2 === 0 ? 'jersey' : 'training',
    price: 15000 + index * 2000,
    stock: 50 - index * 2,
    description: 'Official Rayon Sports merchandise.',
    image_url: `https://placehold.co/400x400?text=Item+${index + 1}`,
    badge: index % 3 === 0 ? 'New' : null,
  }));

  await supabase.from('shop_products').upsert(products as any, { onConflict: 'id' });
}

async function seedFanClubs() {
  const fanClubs = [
    { id: 'club-1', name: 'Gikondo Blues', city: 'Kigali', members: 240 },
    { id: 'club-2', name: 'Nyamirambo Faithful', city: 'Kigali', members: 310 },
  ];
  await supabase.from('fan_clubs').upsert(fanClubs as any, { onConflict: 'id' });
}

async function seedPolls() {
  const poll = {
    id: 'poll-1',
    question: 'Player of the match vs APR?',
    options: ['Mugisha', 'Ishimwe', 'Ulimwengu'],
    results: { Mugisha: 12, Ishimwe: 8, Ulimwengu: 4 },
    active: true,
  };
  await supabase.from('polls').upsert(poll as any, { onConflict: 'id' });
}

async function seedQuotesAndPolicies() {
  const quotes = [
    {
      id: 'quote-1',
      user_id: '22222222-2222-2222-2222-222222222222',
      moto_type: 'Bajaj Boxer',
      plate: 'RAB 123A',
      premium: 65000,
      ticket_perk: true,
      status: 'paid' as const,
      ref: 'INS-001',
    },
    {
      id: 'quote-2',
      user_id: '33333333-3333-3333-3333-333333333333',
      moto_type: 'TVS HLX',
      plate: 'RAB 456B',
      premium: 45000,
      ticket_perk: false,
      status: 'quoted' as const,
      ref: 'INS-002',
    },
  ];

  await supabase.from('insurance_quotes').upsert(quotes as any, { onConflict: 'id' });

  const policies = [
    {
      id: 'policy-1',
      quote_id: 'quote-1',
      number: 'POL-2024-001',
      valid_from: new Date().toISOString(),
      valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      free_ticket_issued: false,
    },
  ];
  await supabase.from('policies').upsert(policies as any, { onConflict: 'id' });
}

async function seedSaccoDeposits() {
  const deposits = [
    {
      id: 'deposit-1',
      user_id: '11111111-1111-1111-1111-111111111111',
      sacco_name: 'Kigali Motos',
      amount: 30000,
      ref: 'SACCO-001',
      status: 'confirmed' as const,
    },
    {
      id: 'deposit-2',
      user_id: '44444444-4444-4444-4444-444444444444',
      sacco_name: 'Gasabo Motos',
      amount: 20000,
      ref: 'SACCO-002',
      status: 'pending' as const,
    },
    {
      id: 'deposit-3',
      user_id: '55555555-5555-5555-5555-555555555555',
      sacco_name: 'Nyarugenge Riders',
      amount: 50000,
      ref: 'SACCO-003',
      status: 'confirmed' as const,
    },
  ];
  await supabase.from('sacco_deposits').upsert(deposits as any, { onConflict: 'id' });
}

async function seedFanPosts() {
  const posts = [
    {
      id: 'post-1',
      user_id: '11111111-1111-1111-1111-111111111111',
      text: 'Twese hamwe dushyigikire Rayon Sports!',
      media_url: null,
      likes: 45,
      comments: 12,
    },
    {
      id: 'post-2',
      user_id: '22222222-2222-2222-2222-222222222222',
      text: 'Ikipe yacu irakomeye kurusha ejo!',
      media_url: 'https://placehold.co/600x400?text=Fans',
      likes: 78,
      comments: 20,
    },
    {
      id: 'post-3',
      user_id: '33333333-3333-3333-3333-333333333333',
      text: 'Turagana ku gikombe! #Gikundiro',
      media_url: null,
      likes: 54,
      comments: 9,
    },
    {
      id: 'post-4',
      user_id: '44444444-4444-4444-4444-444444444444',
      text: 'Ubwitange bwa ba players bwaranshimishije.',
      media_url: null,
      likes: 23,
      comments: 5,
    },
    {
      id: 'post-5',
      user_id: '55555555-5555-5555-5555-555555555555',
      text: "Abafana ni umutima w'ikipe 💙",
      media_url: 'https://placehold.co/600x400?text=Gikundiro',
      likes: 102,
      comments: 34,
    },
  ];

  await supabase.from('fan_posts').upsert(posts as any, { onConflict: 'id' });
}

async function seedTransactions() {
  const transactions = [
    {
      id: 'tx-1',
      user_id: '11111111-1111-1111-1111-111111111111',
      type: 'purchase' as const,
      amount: 50000,
      ref: 'MOMO-ORDER-1',
      status: 'confirmed' as const,
    },
    {
      id: 'tx-2',
      user_id: '22222222-2222-2222-2222-222222222222',
      type: 'purchase' as const,
      amount: 20000,
      ref: 'MOMO-ORDER-2',
      status: 'pending' as const,
    },
    {
      id: 'tx-3',
      user_id: '11111111-1111-1111-1111-111111111111',
      type: 'deposit' as const,
      amount: 60000,
      ref: 'SACCO-001',
      status: 'confirmed' as const,
    },
  ];

  for (const transaction of transactions) {
    await supabase.from('transactions').upsert(transaction as any, { onConflict: 'id' });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
