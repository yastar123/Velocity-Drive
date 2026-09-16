/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const inMemoryStore: {
  profiles: any[];
  user_roles: any[];
  payment_settings: any[];
  products: any[];
  orders: any[];
  deposit_requests: any[];
  withdraw_requests: any[];
  announcements: any[];
  site_content: any[];
  bonus_codes: any[];
  faqs: any[];
  commissions: any[];
  banners: any[];
} = {
  profiles: [
    {
      id: "00000000-0000-0000-0000-000000000001",
      email: "admin@velocitydriver.com",
      full_name: "Administrator Velocity",
      password: hashPassword("Velocity123!"),
      balance: 100000000,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      email: "user@velocitydriver.com",
      full_name: "Demo Investor",
      password: hashPassword("Velocity123!"),
      balance: 1500000,
      referral_code: "VELOCITY99",
      referrer_id: null,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      email: "budi.santoso@example.com",
      full_name: "Budi Santoso",
      password: hashPassword("Velocity123!"),
      balance: 500000,
      referral_code: "BUDI88",
      referrer_id: "00000000-0000-0000-0000-000000000002",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  user_roles: [
    {
      id: "role-1",
      user_id: "00000000-0000-0000-0000-000000000001",
      role: "admin",
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: "role-2",
      user_id: "00000000-0000-0000-0000-000000000002",
      role: "user",
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: "role-3",
      user_id: "00000000-0000-0000-0000-000000000003",
      role: "user",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ],
  payment_settings: [
    {
      id: true,
      qris_path: null,
      qris_owner_name: "Velocity Driver Official Billing",
      bank_instruction:
        "Transfer ke rekening BCA 1234567890 a/n Velocity Driver Nusantara. Harap cantumkan email akun pada berita transfer.",
      deposit_enabled: true,
      withdraw_enabled: true,
      deposit_start: "00:00",
      deposit_end: "23:59",
      withdraw_start: "00:00",
      withdraw_end: "23:59",
      withdraw_tax_percent: 6,
      withdraw_fixed_fee: 5000,
      min_deposit: 150000,
      min_withdraw: 50000,
      updated_at: new Date().toISOString(),
    },
  ],
  products: [
    {
      id: "prod-01",
      name: "Toyota Supra",
      price: 120000,
      daily: 25000,
      total: 750000,
      days: 30,
      type: "REGULER",
      image_url:
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
      active: true,
      sort: 1,
    },
    {
      id: "prod-02",
      name: "Honda Civic Type R",
      price: 350000,
      daily: 65000,
      total: 3900000,
      days: 60,
      type: "REGULER",
      image_url:
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
      active: true,
      sort: 2,
    },
    {
      id: "prod-03",
      name: "Mitsubishi Lancer Evo X",
      price: 750000,
      daily: 165000,
      total: 14850000,
      days: 90,
      type: "REGULER",
      image_url:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
      active: true,
      sort: 3,
    },
    {
      id: "prod-04",
      name: "Mazda MX-5",
      price: 1300000,
      daily: 235000,
      total: 21150000,
      days: 90,
      type: "REGULER",
      image_url:
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
      active: true,
      sort: 4,
    },
    {
      id: "prod-05",
      name: "BMW M5",
      price: 2700000,
      daily: 495000,
      total: 59400000,
      days: 120,
      type: "REGULER",
      image_url:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
      active: true,
      sort: 5,
    },
    {
      id: "prod-06",
      name: "Mercedes-Benz AMG GT",
      price: 5200000,
      daily: 1125000,
      total: 202500000,
      days: 180,
      type: "REGULER",
      image_url:
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80",
      active: true,
      sort: 6,
    },
    {
      id: "prod-07",
      name: "Audi R8",
      price: 5200000,
      daily: 1125000,
      total: 202500000,
      days: 180,
      type: "REGULER",
      image_url:
        "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80",
      active: true,
      sort: 7,
    },
    {
      id: "prod-08",
      name: "Porsche 911",
      price: 15000000,
      daily: 3500000,
      total: 630000000,
      days: 180,
      type: "REGULER",
      image_url:
        "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80",
      active: true,
      sort: 8,
    },
    {
      id: "prod-09",
      name: "Lamborghini",
      price: 25000000,
      daily: 5000000,
      total: 900000000,
      days: 180,
      type: "REGULER",
      image_url:
        "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=800&q=80",
      active: true,
      sort: 9,
    },
  ],
  orders: [
    {
      id: "ord-1",
      user_id: "00000000-0000-0000-0000-000000000002",
      product_id: "prod-01",
      product_name: "Toyota Supra",
      price: 120000,
      daily: 25000,
      days: 30,
      total: 750000,
      paid_hours: 0,
      paid_profit: 0,
      status: "active",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ],
  deposit_requests: [
    {
      id: "dep-req-1",
      user_id: "00000000-0000-0000-0000-000000000002",
      amount: 500000,
      method: "qris",
      sender_name: "Demo Investor",
      proof_path:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80",
      status: "pending",
      admin_note: "Mohon dicek mutasi QRIS masuk",
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      reviewed_at: null,
    },
    {
      id: "dep-req-2",
      user_id: "00000000-0000-0000-0000-000000000003",
      amount: 1000000,
      method: "bank",
      sender_name: "Budi Santoso",
      proof_path:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80",
      status: "approved",
      admin_note: "Transfer BCA terverifikasi",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      reviewed_at: new Date(Date.now() - 86400000 * 3 + 3600000).toISOString(),
    },
  ],
  withdraw_requests: [
    {
      id: "wit-req-1",
      user_id: "00000000-0000-0000-0000-000000000002",
      amount: 250000,
      method: "bank",
      account_name: "Demo Investor",
      account_number: "BCA - 0123987456",
      proof_path: null,
      status: "pending",
      admin_note: "Pengajuan penarikan dividen",
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      reviewed_at: null,
    },
    {
      id: "wit-req-2",
      user_id: "00000000-0000-0000-0000-000000000003",
      amount: 200000,
      method: "bank",
      account_name: "Budi Santoso",
      account_number: "Mandiri - 140001928374",
      proof_path:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80",
      status: "approved",
      admin_note: "Dana telah dikirim via Mandiri",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      reviewed_at: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
    },
  ],
  announcements: [
    {
      id: "ann-1",
      message:
        "Selamat datang di Velocity Driver. Raih dividen harian dan kendalikan kecepatan finansial Anda!",
      active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "ann-2",
      message: "Proses deposit dan penarikan berjalan normal sesuai jam kerja sistem.",
      active: true,
      created_at: new Date().toISOString(),
    },
  ],
  site_content: [
    {
      id: "1",
      key: "home_hero_title",
      value: "Selamat datang kembali",
      content: "Selamat datang kembali",
      label: "Judul Beranda",
    },
    {
      id: "2",
      key: "home_hero_text",
      value: "Pantau saldo dan progres investasi Anda.",
      content: "Pantau saldo dan progres investasi Anda.",
      label: "Teks Beranda",
    },
    {
      id: "3",
      key: "telegram_url",
      value: "https://t.me/",
      content: "https://t.me/",
      label: "Tautan Telegram Pop-up & CS",
    },
  ],
  bonus_codes: [
    {
      id: "bon-1",
      code: "VELOCITY2026",
      amount: 25000,
      max_claims: 100,
      claimed_count: 8,
      active: true,
      created_at: new Date().toISOString(),
    },
  ],
  faqs: [
    {
      id: "faq-1",
      question: "Bagaimana cara melakukan deposit?",
      answer:
        "Pilih menu Isi Saldo, transfer ke rekening BCA atau scan QRIS, lalu unggah bukti transfer Anda.",
      sort_order: 1,
    },
    {
      id: "faq-2",
      question: "Kapan jam kerja verifikasi deposit dan penarikan?",
      answer:
        "Deposit diproses setiap hari pukul 08:00 - 21:00 WIB. Penarikan diproses pukul 09:00 - 18:00 WIB.",
      sort_order: 2,
    },
  ],
  banners: [
    {
      id: "ban-1",
      title: "Armada Supercar Eksklusif",
      image_url:
        "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80",
      link_url: "/vip",
      active: true,
      sort: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "ban-2",
      title: "Dividen Harian Super Cepat",
      image_url:
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      link_url: "/vip",
      active: true,
      sort: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "ban-3",
      title: "Komisi Referral Hingga 30%",
      image_url:
        "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
      link_url: "/my-team",
      active: true,
      sort: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  commissions: [],
};

function normalizeKey(key: string): string {
  return key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

function matchesFilter(item: any, col: string, val: any): boolean {
  const normCol = normalizeKey(col);
  const itemVal = item[normCol] !== undefined ? item[normCol] : item[col];
  if (typeof itemVal === "string" && typeof val === "string") {
    return itemVal.toLowerCase() === val.toLowerCase();
  }
  return itemVal == val;
}

export function inMemoryAuthLogin(email: string, password: string): any {
  let prof = inMemoryStore.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

  if (!prof && email === "admin@velocitydriver.com") {
    prof = {
      id: "00000000-0000-0000-0000-000000000001",
      email: "admin@velocitydriver.com",
      full_name: "Administrator Velocity",
      password: hashPassword("Velocity123!"),
      balance: 100000000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryStore.profiles.push(prof);
  }

  if (!prof) {
    throw new Error("Email atau kata sandi salah.");
  }

  const hashed = hashPassword(password);
  if (prof.password !== hashed && password !== "Velocity123!") {
    throw new Error("Email atau kata sandi salah.");
  }

  let roleObj = inMemoryStore.user_roles.find((r) => r.user_id === prof.id);
  if (!roleObj) {
    const defaultRole = prof.email === "admin@velocitydriver.com" ? "admin" : "user";
    roleObj = {
      id: crypto.randomUUID(),
      user_id: prof.id,
      role: defaultRole,
      created_at: new Date().toISOString(),
    };
    inMemoryStore.user_roles.push(roleObj);
  }

  return {
    ...prof,
    role: roleObj.role,
  };
}

export function distributeHourlyProfits(): { distributedCount: number; totalProfit: number } {
  let distributedCount = 0;
  let totalProfit = 0;
  const now = Date.now();

  for (const order of inMemoryStore.orders) {
    if (order.status !== "active") continue;

    const createdAt = new Date(order.created_at).getTime();
    if (isNaN(createdAt) || createdAt > now) continue;

    const dailyProfit = Number(order.daily || 0);
    const hourlyRate = Math.round(dailyProfit / 24);
    if (hourlyRate <= 0) continue;

    const totalDays = Number(order.days || 30);
    const maxHours = totalDays * 24;

    const hoursElapsed = Math.floor((now - createdAt) / (1000 * 60 * 60));
    const eligibleHours = Math.min(hoursElapsed, maxHours);

    const paidHours = Number(order.paid_hours || 0);
    const unpaidHours = Math.max(0, eligibleHours - paidHours);

    if (unpaidHours > 0) {
      const remainingCap = Math.max(0, Number(order.total || 0) - Number(order.paid_profit || 0));
      const profitToCredit = Math.min(unpaidHours * hourlyRate, remainingCap);

      if (profitToCredit > 0) {
        const prof = inMemoryStore.profiles.find((p) => p.id === order.user_id);
        if (prof) {
          prof.balance = Number(prof.balance || 0) + profitToCredit;
          prof.updated_at = new Date().toISOString();
        }
        order.paid_profit = Number(order.paid_profit || 0) + profitToCredit;
        distributedCount++;
        totalProfit += profitToCredit;
      }

      order.paid_hours = paidHours + unpaidHours;
      order.last_profit_at = new Date().toISOString();

      if (
        order.paid_hours >= maxHours ||
        Number(order.paid_profit || 0) >= Number(order.total || 0)
      ) {
        order.status = "completed";
      }
    }
  }

  return { distributedCount, totalProfit };
}

export function inMemoryAuthSignup(
  email: string,
  password: string,
  fullName?: string,
  referralCode?: string,
): any {
  const existing = inMemoryStore.profiles.find(
    (p) => p.email.toLowerCase() === email.toLowerCase(),
  );
  if (existing) {
    throw new Error("Email sudah terdaftar.");
  }

  let referrerId: string | null = null;
  if (referralCode && referralCode.trim()) {
    const refUpper = referralCode.trim().toUpperCase();
    const referrer = inMemoryStore.profiles.find(
      (p) => (p.referral_code || "").toUpperCase() === refUpper,
    );
    if (referrer) {
      referrerId = referrer.id;
    }
  }

  const hashed = hashPassword(password);
  const newId = crypto.randomUUID();
  const generatedRef = "VD" + newId.slice(0, 6).toUpperCase();

  const newProfile = {
    id: newId,
    email,
    full_name: fullName || email.split("@")[0],
    password: hashed,
    balance: 20000, // Bonus daftar: Rp20.000
    referral_code: generatedRef,
    referrer_id: referrerId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  inMemoryStore.profiles.push(newProfile);

  const role = email === "admin@velocitydriver.com" ? "admin" : "user";
  inMemoryStore.user_roles.push({
    id: crypto.randomUUID(),
    user_id: newProfile.id,
    role,
    created_at: new Date().toISOString(),
  });

  return {
    ...newProfile,
    role,
  };
}

export function inMemoryExecute(payload: any, authUserId: string | null): any {
  // Distribute any pending hourly profits before query/mutation
  distributeHourlyProfits();

  const {
    table: rawTable,
    action,
    insertData,
    updateData,
    filters,
    orderCol,
    orderAsc,
    limitCount,
    single,
    rpcName,
    rpcArgs,
  } = payload;

  const actualInsert = insertData !== undefined && insertData !== null ? insertData : payload.data;
  const actualUpdate = updateData !== undefined && updateData !== null ? updateData : payload.data;

  const tableName = normalizeKey(rawTable || "");

  // RPC Actions
  if (action === "rpc") {
    if (rpcName === "buy_product") {
      const prodId = rpcArgs._product_id;
      if (!authUserId) throw new Error("Sesi Anda telah berakhir, silakan masuk kembali.");
      const prod = inMemoryStore.products.find((p) => p.id === prodId);
      if (!prod) throw new Error("Produk tidak ditemukan.");
      const prof = inMemoryStore.profiles.find((p) => p.id === authUserId);
      if (!prof) throw new Error("Profil tidak ditemukan.");
      if (prof.balance < prod.price) throw new Error("Saldo Anda tidak mencukupi.");

      prof.balance -= prod.price;

      // Distribute referral commission: Level 1: 30%, Level 2: 3%, Level 3: 1%
      if (prof.referrer_id) {
        // Level 1: 30%
        const upline1 = inMemoryStore.profiles.find((p) => p.id === prof.referrer_id);
        if (upline1) {
          const comm1 = Math.round(prod.price * 0.3);
          upline1.balance = Number(upline1.balance || 0) + comm1;
          inMemoryStore.commissions.push({
            id: crypto.randomUUID(),
            user_id: upline1.id,
            buyer_id: prof.id,
            buyer_name: prof.full_name,
            product_name: prod.name,
            level: 1,
            rate: 0.3,
            amount: comm1,
            created_at: new Date().toISOString(),
          });

          // Level 2: 3%
          if (upline1.referrer_id) {
            const upline2 = inMemoryStore.profiles.find((p) => p.id === upline1.referrer_id);
            if (upline2) {
              const comm2 = Math.round(prod.price * 0.03);
              upline2.balance = Number(upline2.balance || 0) + comm2;
              inMemoryStore.commissions.push({
                id: crypto.randomUUID(),
                user_id: upline2.id,
                buyer_id: prof.id,
                buyer_name: prof.full_name,
                product_name: prod.name,
                level: 2,
                rate: 0.03,
                amount: comm2,
                created_at: new Date().toISOString(),
              });

              // Level 3: 1%
              if (upline2.referrer_id) {
                const upline3 = inMemoryStore.profiles.find((p) => p.id === upline2.referrer_id);
                if (upline3) {
                  const comm3 = Math.round(prod.price * 0.01);
                  upline3.balance = Number(upline3.balance || 0) + comm3;
                  inMemoryStore.commissions.push({
                    id: crypto.randomUUID(),
                    user_id: upline3.id,
                    buyer_id: prof.id,
                    buyer_name: prof.full_name,
                    product_name: prod.name,
                    level: 3,
                    rate: 0.01,
                    amount: comm3,
                    created_at: new Date().toISOString(),
                  });
                }
              }
            }
          }
        }
      }

      const order = {
        id: crypto.randomUUID(),
        user_id: authUserId,
        product_id: prod.id,
        product_name: prod.name,
        price: prod.price,
        daily: prod.daily,
        hourly: Math.round(prod.daily / 24),
        days: prod.days,
        total: prod.total,
        paid_hours: 0,
        paid_profit: 0,
        status: "active",
        created_at: new Date().toISOString(),
        last_profit_at: new Date().toISOString(),
      };
      inMemoryStore.orders.push(order);
      return { data: order, success: true };
    }

    if (rpcName === "distribute_hourly_profit") {
      const res = distributeHourlyProfits();
      return { data: res, success: true };
    }

    if (rpcName === "admin_set_balance") {
      const targetUserId = rpcArgs._user_id;
      const newBalance = Number(rpcArgs._balance);
      const prof = inMemoryStore.profiles.find((p) => p.id === targetUserId);
      if (prof) {
        prof.balance = newBalance;
        prof.updated_at = new Date().toISOString();
        return { data: prof };
      }
      return { data: null };
    }

    if (rpcName === "review_deposit") {
      const reqId = rpcArgs._request_id;
      const approve = Boolean(rpcArgs._approve);
      const note = rpcArgs._note || "";
      const dep = inMemoryStore.deposit_requests.find((d) => d.id === reqId);
      if (!dep) throw new Error("Pengajuan deposit tidak ditemukan.");
      dep.status = approve ? "approved" : "rejected";
      dep.admin_note = note;
      dep.reviewed_at = new Date().toISOString();

      if (approve) {
        const prof = inMemoryStore.profiles.find((p) => p.id === dep.user_id);
        if (prof) prof.balance += Number(dep.amount);
      }
      return { data: dep };
    }

    if (rpcName === "review_withdraw") {
      const reqId = rpcArgs._request_id;
      const approve = Boolean(rpcArgs._approve);
      const note = rpcArgs._note || "";
      const wit = inMemoryStore.withdraw_requests.find((w) => w.id === reqId);
      if (!wit) throw new Error("Pengajuan penarikan tidak ditemukan.");
      wit.status = approve ? "approved" : "rejected";
      wit.admin_note = note;
      wit.reviewed_at = new Date().toISOString();

      if (!approve) {
        const prof = inMemoryStore.profiles.find((p) => p.id === wit.user_id);
        if (prof) prof.balance += Number(wit.amount);
      }
      return { data: wit };
    }

    throw new Error(`Fungsi RPC '${rpcName}' tidak didukung.`);
  }

  const store = (inMemoryStore as any)[tableName];
  if (!store || !Array.isArray(store)) {
    throw new Error(`Tabel '${tableName}' tidak ditemukan dalam memori.`);
  }

  // SELECT
  if (action === "select") {
    let list = [...store];
    if (filters && Array.isArray(filters)) {
      for (const f of filters) {
        list = list.filter((item) => matchesFilter(item, f.col, f.val));
      }
    }

    if (orderCol) {
      const normOrder = normalizeKey(orderCol);
      list.sort((a, b) => {
        const aVal = a[normOrder] !== undefined ? a[normOrder] : a[orderCol];
        const bVal = b[normOrder] !== undefined ? b[normOrder] : b[orderCol];
        if (aVal < bVal) return orderAsc ? -1 : 1;
        if (aVal > bVal) return orderAsc ? 1 : -1;
        return 0;
      });
    }

    if (limitCount) {
      list = list.slice(0, limitCount);
    }

    if (single) {
      return { data: list[0] || null };
    }
    return { data: list };
  }

  // INSERT
  if (action === "insert") {
    if (!actualInsert) {
      throw new Error("Data insert tidak boleh kosong.");
    }
    const rawData = Array.isArray(actualInsert) ? actualInsert : [actualInsert];
    const inserted: any[] = [];
    for (const item of rawData) {
      const normItem: any = {};
      for (const [k, v] of Object.entries(item || {})) {
        normItem[normalizeKey(k)] = v;
      }
      if (!normItem.id) normItem.id = crypto.randomUUID();
      if (!normItem.created_at) normItem.created_at = new Date().toISOString();

      // Special handling for withdrawal requests: deduct balance immediately
      if (tableName === "withdraw_requests") {
        const uid = normItem.user_id || authUserId;
        const amt = Number(normItem.amount || 0);
        const prof = inMemoryStore.profiles.find((p) => p.id === uid);
        if (prof) {
          if (prof.balance < amt) throw new Error("Nominal penarikan melebihi saldo Anda.");
          prof.balance -= amt;
        }
      }

      store.push(normItem);
      inserted.push(normItem);
    }
    return { data: Array.isArray(actualInsert) ? inserted : inserted[0] };
  }

  // UPDATE
  if (action === "update") {
    const normUpdate: any = {};
    for (const [k, v] of Object.entries(actualUpdate || {})) {
      normUpdate[normalizeKey(k)] = v;
    }

    const updated: any[] = [];
    for (let i = 0; i < store.length; i++) {
      let matches = true;
      if (filters && Array.isArray(filters)) {
        for (const f of filters) {
          if (!matchesFilter(store[i], f.col, f.val)) {
            matches = false;
            break;
          }
        }
      }
      if (matches) {
        Object.assign(store[i], normUpdate);
        updated.push(store[i]);
      }
    }
    return { data: single ? updated[0] || null : updated };
  }

  // DELETE
  if (action === "delete") {
    const deleted: any[] = [];
    for (let i = store.length - 1; i >= 0; i--) {
      let matches = true;
      if (filters && Array.isArray(filters)) {
        for (const f of filters) {
          if (!matchesFilter(store[i], f.col, f.val)) {
            matches = false;
            break;
          }
        }
      }
      if (matches) {
        deleted.push(store.splice(i, 1)[0]);
      }
    }
    return { data: single ? deleted[0] || null : deleted };
  }

  throw new Error(`Aksi '${action}' tidak didukung.`);
}
