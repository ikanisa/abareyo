import http from 'node:http';

const port = Number.parseInt(process.env.MOCK_PORT ?? '3000', 10);
const delays = {
  '/api/live/scoreboard': Number.parseInt(process.env.DELAY_SCOREBOARD ?? '40', 10),
  '/api/live/match/demo': Number.parseInt(process.env.DELAY_MATCH ?? '60', 10),
  '/admin/api/users/directory': Number.parseInt(process.env.DELAY_USERS ?? '120', 10),
  '/admin/api/content/library': Number.parseInt(process.env.DELAY_CONTENT ?? '160', 10),
  '/admin/api/shop/products': Number.parseInt(process.env.DELAY_PRODUCTS ?? '200', 10),
};

const responses = {
  '/api/live/scoreboard': {
    status: 200,
    body: {
      matchId: 'demo',
      home: 'Rayon',
      away: 'APR',
      score: '1-0',
      minute: 35,
      timeline: [{ min: 12, event: 'Goal Rayon' }],
    },
  },
  '/api/live/match/demo': {
    status: 200,
    body: {
      id: 'demo',
      venue: 'Amahoro Stadium',
      attendance: 26000,
      weather: 'Partly Cloudy',
    },
  },
  '/admin/api/users/directory': {
    status: 200,
    body: {
      users: Array.from({ length: 5 }, (_, idx) => ({
        id: `user-${idx + 1}`,
        display_name: `Test User ${idx + 1}`,
        phone: `+250788000${idx + 1}`,
        public_profile: true,
        created_at: new Date(Date.now() - idx * 86400000).toISOString(),
      })),
    },
  },
  '/admin/api/content/library': {
    status: 200,
    body: {
      assets: Array.from({ length: 3 }, (_, idx) => ({
        id: `asset-${idx + 1}`,
        title: `Content Asset ${idx + 1}`,
        status: idx % 2 === 0 ? 'published' : 'draft',
        updated_at: new Date(Date.now() - idx * 3600000).toISOString(),
      })),
    },
  },
  '/admin/api/shop/products': {
    status: 200,
    body: {
      products: Array.from({ length: 4 }, (_, idx) => ({
        id: `product-${idx + 1}`,
        sku: `SKU-${idx + 1}`,
        price: 25000 + idx * 5000,
        stock: 10 + idx * 3,
      })),
    },
  },
};

const server = http.createServer((req, res) => {
  const route = req.url?.split('?')[0] ?? '';
  const response = responses[route];
  if (!response) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
    return;
  }

  const delay = delays[route] ?? 0;
  setTimeout(() => {
    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response.body));
  }, delay);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Mock service listening on http://0.0.0.0:${port}`);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down mock service');
  server.close(() => process.exit(0));
});
