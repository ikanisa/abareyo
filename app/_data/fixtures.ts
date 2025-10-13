export type TicketZone = {
  id: string;
  name: "VIP" | "Regular" | "Fan";
  price: number;
  seatsLeft: number;
  totalSeats: number;
};

export type Fixture = {
  id: string;
  title: string;
  comp: string;
  date: string;
  time: string;
  venue: string;
  zones: TicketZone[];
  status: "upcoming" | "soldout" | "completed";
  heroImage: string;
};

export type Order = {
  id: string;
  fixtureId: string;
  zoneId: string;
  qty: number;
  total: number;
  status: "pending" | "paid" | "used" | "cancelled";
  qrCode: string;
};

export const fixtures: Fixture[] = [
  {
    id: "rcl-2024-11-03",
    title: "Rayon Sports vs APR FC",
    comp: "Rwanda Premier League",
    date: "Sun, 3 Nov 2024",
    time: "18:00",
    venue: "Amahoro Stadium",
    status: "upcoming",
    heroImage: "/tickets/rayon-apr.svg",
    zones: [
      { id: "vip-north", name: "VIP", price: 35000, seatsLeft: 42, totalSeats: 300 },
      { id: "regular-east", name: "Regular", price: 15000, seatsLeft: 128, totalSeats: 800 },
      { id: "fan-blue", name: "Fan", price: 8000, seatsLeft: 63, totalSeats: 500 },
    ],
  },
  {
    id: "acl-2024-11-17",
    title: "Rayon Sports vs Simba SC",
    comp: "CAF Champions League",
    date: "Sun, 17 Nov 2024",
    time: "20:00",
    venue: "BK Arena",
    status: "upcoming",
    heroImage: "/tickets/rayon-simba.svg",
    zones: [
      { id: "vip-west", name: "VIP", price: 42000, seatsLeft: 10, totalSeats: 250 },
      { id: "regular-south", name: "Regular", price: 20000, seatsLeft: 214, totalSeats: 900 },
      { id: "fan-white", name: "Fan", price: 10000, seatsLeft: 0, totalSeats: 600 },
    ],
  },
  {
    id: "friendly-2024-10-12",
    title: "Rayon Legends Match",
    comp: "Legends Showcase",
    date: "Sat, 12 Oct 2024",
    time: "16:00",
    venue: "Kigali Pele Stadium",
    status: "completed",
    heroImage: "/tickets/rayon-legends.svg",
    zones: [
      { id: "vip-legends", name: "VIP", price: 28000, seatsLeft: 0, totalSeats: 250 },
      { id: "regular-legends", name: "Regular", price: 12000, seatsLeft: 0, totalSeats: 700 },
      { id: "fan-legends", name: "Fan", price: 6000, seatsLeft: 0, totalSeats: 400 },
    ],
  },
];

export const orders: Order[] = [
  {
    id: "ORD-98341",
    fixtureId: "rcl-2024-11-03",
    zoneId: "regular-east",
    qty: 2,
    total: 30000,
    status: "pending",
    qrCode: "/tickets/qr-pending.svg",
  },
  {
    id: "ORD-98277",
    fixtureId: "acl-2024-11-17",
    zoneId: "vip-west",
    qty: 3,
    total: 126000,
    status: "paid",
    qrCode: "/tickets/qr-active.svg",
  },
  {
    id: "ORD-97210",
    fixtureId: "friendly-2024-10-12",
    zoneId: "vip-legends",
    qty: 1,
    total: 28000,
    status: "used",
    qrCode: "/tickets/qr-used.svg",
  },
  {
    id: "ORD-96004",
    fixtureId: "friendly-2024-10-12",
    zoneId: "fan-legends",
    qty: 4,
    total: 24000,
    status: "cancelled",
    qrCode: "/tickets/qr-cancelled.svg",
  },
];
