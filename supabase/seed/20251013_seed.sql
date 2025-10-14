insert into public.users (name, phone, momo_number, tier, points)
values ('Guest Fan', '0780000000', '0780000000', 'fan', 1200)
on conflict do nothing;

insert into public.matches (title, comp, date, venue, status, home_team, away_team, vip_price, regular_price, seats_vip, seats_regular)
values
('Rayon vs APR', 'Rwanda Premier League', now() + interval '3 day', 'Amahoro', 'upcoming', 'Rayon', 'APR', 15000, 5000, 420, 3510),
('Rayon vs Police', 'Rwanda Premier League', now() + interval '10 day', 'Kigali', 'upcoming', 'Rayon', 'Police', 15000, 5000, 420, 3510);

insert into public.shop_products (name, category, price, stock, description, image_url, badge)
values
('Home Jersey 24/25', 'jerseys', 25000, 25, 'Official home kit', '/shop/home1.png', 'official'),
('Away Jersey 24/25', 'jerseys', 25000, 18, 'Official away kit', '/shop/away1.png', 'official'),
('Scarf Classic', 'accessories', 10000, 40, 'Warm knit scarf', '/shop/scarf1.png', 'sale');
