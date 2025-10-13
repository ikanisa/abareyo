export type FanProfile = {
  id: string;
  name: string;
  phone: string;
  membership: "Member" | "Premium" | "Guest" | "Fan";
  momo?: string;
};

export const fanProfile: FanProfile = {
  id: "RS-0780000000",
  name: "Guest Fan",
  phone: "0780000000",
  membership: "Fan",
  momo: "0780000000",
};
