import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://localhost:3000/api/health', () =>
    HttpResponse.json({ status: 'ok' }),
  ),
] as const;
