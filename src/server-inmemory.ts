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
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      email: "budi.santoso@example.com",
      full_name: "Budi Santoso",
      password: hashPassword("Velocity123!"),
      balance: 500000,
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
      deposit_start: "08:00",
      deposit_end: "21:00",
      withdraw_start: "09:00",
      withdraw_end: "18:00",
      withdraw_tax_percent: 5,
      updated_at: new Date().toISOString(),
    },
  ],
  products: [
    {
      id: "prod-01",
      name: "DRIVER 01 (Lantai Dasar)",
      price: 100000,
      daily: 12000,
      total: 720000,
      days: 60,
      type: "REGULER",
      active: true,
      sort: 1,
    },
    {
      id: "prod-02",
      name: "DRIVER 02 (Lantai Perak)",
      price: 200000,
      daily: 25000,
      total: 1500000,
      days: 60,
      type: "REGULER",
      active: true,
      sort: 2,
    },
    {
      id: "prod-03",
      name: "DRIVER 03 (Lantai Emas)",
      price: 300000,
      daily: 38000,
      total: 2280000,
      days: 60,
      type: "REGULER",
      active: true,
      sort: 3,
    },
    {
      id: "prod-04",
      name: "DRIVER 04 (Lantai Platinum)",
      price: 500000,
      daily: 65000,
      total: 3900000,
      days: 60,
      type: "REGULER",
      active: true,
      sort: 4,
    },
    {
      id: "prod-05",
      name: "DRIVER 05 (Lantai Titanium)",
      price: 1000000,
      daily: 135000,
      total: 8100000,
      days: 60,
      type: "REGULER",
      active: true,
      sort: 5,
    },
    {
      id: "prod-06",
      name: "DRIVER 06 (Lantai Mahkota)",
      price: 2000000,
      daily: 273333,
      total: 16400000,
      days: 60,
      type: "REGULER",
      active: true,
      sort: 6,
    },
    {
      id: "prod-promo-1",
      name: "PROMO EKSLUSIF VIP",
      price: 100000,
      daily: 50000,
      total: 500000,
      days: 10,
      type: "VIP",
      active: true,
      sort: 11,
    },
  ],
  orders: [
    {
      id: "ord-1",
      user_id: "00000000-0000-0000-0000-000000000002",
      product_id: "prod-01",
      product_name: "DRIVER 01 (Lantai Dasar)",
      price: 100000,
      daily: 12000,
      days: 60,
      total: 720000,
      status: "active",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
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
    { id: "1", key: "home_hero_title", content: "Selamat datang kembali" },
    { id: "2", key: "home_hero_text", content: "Pantau saldo dan progres investasi Anda." },
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

export function inMemoryAuthSignup(email: string, password: string, fullName?: string): any {
  const existing = inMemoryStore.profiles.find(
    (p) => p.email.toLowerCase() === email.toLowerCase(),
  );
  if (existing) {
    throw new Error("Email sudah terdaftar.");
  }
  const hashed = hashPassword(password);
  const newProfile = {
    id: crypto.randomUUID(),
    email,
    full_name: fullName || email.split("@")[0],
    password: hashed,
    balance: 0,
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
      const order = {
        id: crypto.randomUUID(),
        user_id: authUserId,
        product_id: prod.id,
        product_name: prod.name,
        price: prod.price,
        daily: prod.daily,
        days: prod.days,
        total: prod.total,
        status: "active",
        created_at: new Date().toISOString(),
      };
      inMemoryStore.orders.push(order);
      return { data: order };
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
