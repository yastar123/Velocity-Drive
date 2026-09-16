export type Product = {
  id: string;
  name: string;
  price: number;
  daily: number;
  total: number;
  days: number;
  type: "REGULER" | "VIP";
};
export const products: Product[] = [
  ["1", "Toyota Supra", 120000, 25000, 750000, 30, "REGULER"],
  ["2", "Honda Civic Type R", 350000, 65000, 3900000, 60, "REGULER"],
  ["3", "Mitsubishi Lancer Evo X", 750000, 165000, 14850000, 90, "REGULER"],
  ["4", "Mazda MX-5", 1300000, 235000, 21150000, 90, "REGULER"],
  ["5", "BMW M5", 2700000, 495000, 59400000, 120, "REGULER"],
  ["6", "Mercedes-Benz AMG GT", 5200000, 1125000, 202500000, 180, "REGULER"],
  ["7", "Audi R8", 5200000, 1125000, 202500000, 180, "REGULER"],
  ["8", "Porsche 911", 15000000, 3500000, 630000000, 180, "REGULER"],
  ["9", "Lamborghini", 25000000, 5000000, 900000000, 180, "REGULER"],
].map(([id, name, price, daily, total, days, type]) => ({
  id: String(id),
  name: String(name),
  price: Number(price),
  daily: Number(daily),
  total: Number(total),
  days: Number(days),
  type: type as Product["type"],
}));
export const rupiah = (n: number) => `Rp${new Intl.NumberFormat("id-ID").format(n)}`;
export const banks = [
  "BCA",
  "BRI",
  "BNI",
  "Mandiri",
  "OCBC",
  "Permata",
  "Danamon",
  "CIMB Niaga",
  "BTN",
  "Panin",
  "Mega",
  "Maybank",
  "Sinarmas",
  "BTPN / SMBC",
  "Jago",
  "Muamalat",
  "BSI",
  "DKI",
  "Jatim",
  "BJB",
  "GoPay",
  "DANA",
  "OVO",
  "ShopeePay",
  "LinkAja",
  "i.Saku",
  "Sakuku",
  "DOKU",
  "AstraPay",
];
export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Velocity Driver` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Velocity Driver` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
