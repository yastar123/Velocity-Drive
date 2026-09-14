import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  price: number;
  daily: number;
  total: number;
  days: number;
  type: string;
  description: string | null;
  active: boolean;
  sort: number;
};

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

const productCols = "id,name,price,daily,total,days,type,description,active,sort";

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
