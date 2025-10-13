export type FanProfile = {
  id: string;
  name: string;
  phone: string;
  membership: "Member" | "Premium" | "Guest";
};

export const fanProfile: FanProfile = {
  id: "RS-2048",
  name: "Ange Uwimana",
  phone: "+250 788 000 111",
  membership: "Premium",
};
