import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  price: number;
  daily: number;
  total: number;
  days: number;
  type: string;
  image_url?: string | null;
  description: string | null;
  active: boolean;
  sort: number;
};

export const defaultCarImages: Record<string, string> = {
  "Toyota Supra":
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
  "Honda Civic Type R":
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
  "Mitsubishi Lancer Evo X":
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
  "Mazda MX-5":
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
  "BMW M5":
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
  "Mercedes-Benz AMG GT":
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80",
  "Audi R8":
    "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80",
  "Porsche 911":
    "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80",
  Lamborghini:
    "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=800&q=80",
};

export function getProductImageUrl(p: { name: string; image_url?: string | null }): string {
  if (p.image_url && p.image_url.trim().length > 0) return p.image_url.trim();
  const matched = defaultCarImages[p.name];
  if (matched) return matched;
  // Generic high-performance car fallback
  return "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80";
}

export type Faq = { id: string; question: string; answer: string; active: boolean; sort: number };
export type Announcement = { id: string; message: string; active: boolean; sort: number };
export type BonusCode = {
  id: string;
  code: string;
  amount: number;
  max_uses: number;
  used_count: number;
  active: boolean;
};
export type Order = {
  id: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  daily: number;
  days: number;
  total: number;
  status: string;
  created_at: string;
};
export type SiteContent = { key: string; value: string; label: string | null };

const productCols = "id,name,price,daily,total,days,type,description,active,sort,image_url";

export async function fetchProducts(all = false): Promise<Product[]> {
  let q = supabase.from("products").select(productCols).order("sort").order("price");
  if (!all) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as Product[];
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data } = await supabase.from("products").select(productCols).eq("id", id).maybeSingle();
  return (data as Product | null) ?? null;
}

export async function fetchFaqs(all = false): Promise<Faq[]> {
  let q = supabase.from("faqs").select("id,question,answer,active,sort").order("sort");
  if (!all) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as Faq[];
}

export async function fetchAnnouncements(all = false): Promise<Announcement[]> {
  let q = supabase.from("announcements").select("id,message,active,sort").order("sort");
  if (!all) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as Announcement[];
}

export async function fetchSiteContent(): Promise<Record<string, string>> {
  const { data } = await supabase.from("site_content").select("key,value");
  const out: Record<string, string> = {};
  for (const r of data ?? []) out[r.key] = r.value;
  return out;
}

export async function fetchSiteContentRows(): Promise<SiteContent[]> {
  const { data } = await supabase.from("site_content").select("key,value,label").order("key");
  return (data ?? []) as SiteContent[];
}

export async function fetchMyOrders(userId: string): Promise<Order[]> {
  const { data } = await supabase
    .from("orders")
    .select("id,user_id,product_id,product_name,price,daily,days,total,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Order[];
}

export type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  active: boolean;
  sort: number;
  created_at?: string;
  updated_at?: string;
};

export const defaultBanners: Banner[] = [
  {
    id: "ban-1",
    title: "Armada Supercar Eksklusif",
    image_url:
      "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80",
    link_url: "/vip",
    active: true,
    sort: 1,
  },
  {
    id: "ban-2",
    title: "Dividen Harian Super Cepat",
    image_url:
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    link_url: "/vip",
    active: true,
    sort: 2,
  },
  {
    id: "ban-3",
    title: "Komisi Referral Hingga 30%",
    image_url:
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
    link_url: "/my-team",
    active: true,
    sort: 3,
  },
];

export async function fetchBanners(all = false): Promise<Banner[]> {
  let q = supabase.from("banners").select("id,title,image_url,link_url,active,sort").order("sort");
  if (!all) q = q.eq("active", true);
  const { data, error } = await q;
  if (error || !data || data.length === 0) {
    return all ? defaultBanners : defaultBanners.filter((b) => b.active);
  }
  return data as Banner[];
}
