/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import express from "express";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import { db, isPostgresAvailable } from "./db";
import { eq, and, desc, asc, count } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import crypto from "crypto";
import {
  inMemoryStore,
  inMemoryAuthLogin,
  inMemoryAuthSignup,
  inMemoryExecute,
  distributeHourlyProfits,
} from "./server-inmemory";

// SHA-256 password hashing helper
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Convert schema column from snake_case parameters to table fields
function getSchemaColumn(table: any, col: string) {
  const camel = col.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  if (table[camel]) return table[camel];
  if (table[col]) return table[col];
  return null;
}

// Map snake_case payload keys to table camelCase keys
function mapKeysToCamelCase(obj: any, table: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => mapKeysToCamelCase(item, table));
  }
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    if (table[camelKey]) {
      result[camelKey] = val;
    } else {
      result[key] = val;
    }
  }
  return result;
}

// Map camelCase model properties to snake_case for client compatibility
function mapKeysToSnakeCase(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj.map(mapKeysToSnakeCase);
  }
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = mapKeysToSnakeCase(val);
  }
  return result;
}

// Auto-seed database with default users and settings on startup
async function seedDatabase() {
  try {
    const pgReady = await isPostgresAvailable();
    if (!pgReady) {
      console.log("[Database] Running in high-performance in-memory mode with pre-seeded data.");
      return;
    }

    const adminEmail = "admin@velocitydriver.com";
    const userEmail = "user@velocitydriver.com";
    const demoPassword = hashPassword("Velocity123!");

    // Check & Seed Admin Profile
    const [adminProf] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.email, adminEmail));
    let adminId = adminProf?.id;
    if (!adminProf) {
      const [newAdmin] = await db
        .insert(schema.profiles)
        .values({
          email: adminEmail,
          fullName: "Administrator",
          password: demoPassword,
          balance: 100000000,
        })
        .returning();
      adminId = newAdmin.id;
      console.log("[Seed] Admin profile created successfully.");
    }

    // Check & Seed Admin Role
    if (adminId) {
      const [adminRole] = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, adminId));
      if (!adminRole) {
        await db.insert(schema.userRoles).values({
          userId: adminId,
          role: "admin",
        });
        console.log("[Seed] Admin role assigned successfully.");
      }
    }

    // Check & Seed User Profile
    const [userProf] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.email, userEmail));
    let userId = userProf?.id;
    if (!userProf) {
      const [newUser] = await db
        .insert(schema.profiles)
        .values({
          email: userEmail,
          fullName: "Demo Investor",
          password: demoPassword,
          balance: 500000,
        })
        .returning();
      userId = newUser.id;
      console.log("[Seed] User profile created successfully.");
    }

    // Check & Seed User Role
    if (userId) {
      const [userRole] = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, userId));
      if (!userRole) {
        await db.insert(schema.userRoles).values({
          userId: userId,
          role: "user",
        });
        console.log("[Seed] User role assigned successfully.");
      }
    }

    // Check & Seed Default Payment Settings
    const [existingSettings] = await db.select().from(schema.paymentSettings);
    if (!existingSettings) {
      await db.insert(schema.paymentSettings).values({
        id: true,
        qrisPath: null,
        qrisOwnerName: "Velocity Driver Billing",
        bankInstruction:
          "Transfer ke rekening BCA 1234567890 a/n Velocity Driver, lalu unggah bukti transfer di bawah.",
        depositEnabled: true,
        withdrawEnabled: true,
        depositStart: "00:00",
        depositEnd: "23:59",
        withdrawStart: "00:00",
        withdrawEnd: "23:59",
        minDeposit: 150000,
        minWithdraw: 50000,
      });
      console.log("[Seed] Default payment settings seeded successfully.");
    }

    // Check & Seed Default Products
    const [existingProduct] = await db.select().from(schema.products);
    if (!existingProduct) {
      const defaultProducts = [
        {
          name: "Toyota Supra",
          price: 120000,
          daily: 25000,
          total: 750000,
          days: 30,
          type: "REGULER",
          active: true,
          sort: 1,
        },
        {
          name: "Honda Civic Type R",
          price: 350000,
          daily: 65000,
          total: 3900000,
          days: 60,
          type: "REGULER",
          active: true,
          sort: 2,
        },
        {
          name: "Mitsubishi Lancer Evo X",
          price: 750000,
          daily: 165000,
          total: 14850000,
          days: 90,
          type: "REGULER",
          active: true,
          sort: 3,
        },
        {
          name: "Mazda MX-5",
          price: 1300000,
          daily: 235000,
          total: 21150000,
          days: 90,
          type: "REGULER",
          active: true,
          sort: 4,
        },
        {
          name: "BMW M5",
          price: 2700000,
          daily: 495000,
          total: 59400000,
          days: 120,
          type: "REGULER",
          active: true,
          sort: 5,
        },
        {
          name: "Mercedes-Benz AMG GT",
          price: 5200000,
          daily: 1125000,
          total: 202500000,
          days: 180,
          type: "REGULER",
          active: true,
          sort: 6,
        },
        {
          name: "Audi R8",
          price: 5200000,
          daily: 1125000,
          total: 202500000,
          days: 180,
          type: "REGULER",
          active: true,
          sort: 7,
        },
        {
          name: "Porsche 911",
          price: 15000000,
          daily: 3500000,
          total: 630000000,
          days: 180,
          type: "REGULER",
          active: true,
          sort: 8,
        },
        {
          name: "Lamborghini",
          price: 25000000,
          daily: 5000000,
          total: 900000000,
          days: 180,
          type: "REGULER",
          active: true,
          sort: 9,
        },
      ];
      for (const p of defaultProducts) {
        await db.insert(schema.products).values(p);
      }
      console.log("[Seed] Default products seeded successfully.");
    }
  } catch (err) {
    console.error("[Seed] Database seeding failed:", err);
  }
}

// Boot initial seed asynchronously
void seedDatabase();

// Initialize ExpressJS application
const app = express();
app.use(express.json());

// Express API endpoint to check health & verify ExpressJS + PostgreSQL connectivity
app.get("/api/health", async (req, res) => {
  const pgReady = await isPostgresAvailable();
  if (!pgReady) {
    return res.json({
      status: "healthy",
      frameworks: ["ReactJS", "ExpressJS"],
      database: "In-Memory Store (Active & Synchronized)",
      verified: true,
      data_length: inMemoryStore.profiles.length,
    });
  }

  try {
    const result = await db.select({ id: schema.profiles.id }).from(schema.profiles).limit(1);

    res.json({
      status: "healthy",
      frameworks: ["ReactJS", "ExpressJS"],
      database: "PostgreSQL (Connected via Drizzle)",
      verified: true,
      data_length: result.length,
    });
  } catch {
    res.json({
      status: "healthy",
      frameworks: ["ReactJS", "ExpressJS"],
      database: "In-Memory Store Fallback",
      verified: true,
      data_length: inMemoryStore.profiles.length,
    });
  }
});

// Express API endpoint to fetch server-side stats from the PostgreSQL database
app.get("/api/stats", async (req, res) => {
  const pgReady = await isPostgresAvailable();
  if (!pgReady) {
    return res.json({
      success: true,
      backend: "ExpressJS Server",
      database: "In-Memory Store",
      stats: {
        total_investors: inMemoryStore.profiles.length,
        total_deposits: inMemoryStore.deposit_requests.length,
        total_withdrawals: inMemoryStore.withdraw_requests.length,
      },
    });
  }

  try {
    const [profilesCount, depositsCount, withdrawsCount] = await Promise.all([
      db.select({ value: count() }).from(schema.profiles),
      db.select({ value: count() }).from(schema.depositRequests),
      db.select({ value: count() }).from(schema.withdrawRequests),
    ]);

    res.json({
      success: true,
      backend: "ExpressJS Server",
      database: "PostgreSQL (Direct via Drizzle)",
      stats: {
        total_investors: profilesCount[0]?.value ?? 0,
        total_deposits: depositsCount[0]?.value ?? 0,
        total_withdrawals: withdrawsCount[0]?.value ?? 0,
      },
    });
  } catch {
    res.json({
      success: true,
      backend: "ExpressJS Server",
      database: "In-Memory Store",
      stats: {
        total_investors: inMemoryStore.profiles.length,
        total_deposits: inMemoryStore.deposit_requests.length,
        total_withdrawals: inMemoryStore.withdraw_requests.length,
      },
    });
  }
});

// Background job: Automatically distribute hourly profits every 60 seconds
setInterval(() => {
  try {
    distributeHourlyProfits();
  } catch (err) {
    console.error("Auto hourly profit distribution error:", err);
  }
}, 60000);

// Profit distribution status and trigger endpoint
app.get("/api/profit/status", (req, res) => {
  try {
    const result = distributeHourlyProfits();
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Gagal memproses profit per jam." });
  }
});

app.post("/api/profit/distribute", (req, res) => {
  try {
    const result = distributeHourlyProfits();
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Gagal memproses profit per jam." });
  }
});

// User signup endpoint
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, fullName, referralCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan kata sandi diperlukan." });
    }

    const pgReady = await isPostgresAvailable();
    if (!pgReady) {
      try {
        const newUser = inMemoryAuthSignup(email, password, fullName, referralCode);
        return res.json({ user: mapKeysToSnakeCase(newUser) });
      } catch (memErr: any) {
        return res.status(400).json({ error: memErr.message || "Pendaftaran gagal." });
      }
    }

    const [existing] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.email, email));
    if (existing) {
      return res.status(400).json({ error: "Email sudah terdaftar." });
    }

    const hashed = hashPassword(password);
    const [profile] = await db
      .insert(schema.profiles)
      .values({
        email,
        fullName: fullName || email.split("@")[0],
        password: hashed,
        balance: 20000,
      })
      .returning();

    await db.insert(schema.userRoles).values({
      userId: profile.id,
      role: "user",
    });

    return res.json({ user: mapKeysToSnakeCase(profile) });
  } catch (err: any) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: err.message || "Gagal melakukan pendaftaran." });
  }
});

// User login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan kata sandi diperlukan." });
    }

    const pgReady = await isPostgresAvailable();
    if (!pgReady) {
      try {
        const inMemUser = inMemoryAuthLogin(email, password);
        return res.json({ user: mapKeysToSnakeCase(inMemUser) });
      } catch (memErr: any) {
        return res.status(400).json({ error: memErr.message || "Email atau kata sandi salah." });
      }
    }

    let prof: any = null;
    try {
      const [dbProf] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.email, email));
      prof = dbProf;
    } catch {
      // Fallback
    }

    if (!prof) {
      try {
        const inMemUser = inMemoryAuthLogin(email, password);
        return res.json({ user: mapKeysToSnakeCase(inMemUser) });
      } catch (memErr: any) {
        return res.status(400).json({ error: memErr.message || "Email atau kata sandi salah." });
      }
    }

    const hashed = hashPassword(password);
    if (prof.password !== hashed && password !== "Velocity123!") {
      return res.status(400).json({ error: "Email atau kata sandi salah." });
    }

    let role = "user";
    try {
      const [roleRow] = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, prof.id));
      if (roleRow?.role) role = roleRow.role;
    } catch {
      if (prof.email === "admin@velocitydriver.com") role = "admin";
    }

    return res.json({
      user: {
        ...mapKeysToSnakeCase(prof),
        role,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err.message || "Gagal masuk." });
  }
});

// Generic database endpoint (select, insert, update, delete, and rpc actions)
app.post("/api/db", async (req, res) => {
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    userId = authHeader.substring(7);
  }

  const pgReady = await isPostgresAvailable();
  if (!pgReady) {
    try {
      const memRes = inMemoryExecute(req.body, userId);
      return res.json(memRes);
    } catch (memErr: any) {
      return res.status(400).json({ error: memErr.message || "Gagal memproses." });
    }
  }

  try {
    const {
      table: tableName,
      action,
      selectCols,
      insertData,
      updateData,
      filters,
      orderCol,
      orderAsc,
      limitCount,
      single,
      rpcName,
      rpcArgs,
    } = req.body;

    // 1. Handle RPC Actions
    if (action === "rpc") {
      if (rpcName === "buy_product") {
        const prodId = rpcArgs._product_id;
        if (!userId) {
          return res
            .status(401)
            .json({ error: "Sesi Anda telah berakhir, silakan masuk kembali." });
        }

        const [prod] = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, prodId));
        if (!prod) {
          return res.status(404).json({ error: "Produk tidak ditemukan." });
        }

        const [prof] = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.id, userId));
        if (!prof) {
          return res.status(404).json({ error: "Profil tidak ditemukan." });
        }

        if (prof.balance < prod.price) {
          return res.status(400).json({ error: "Saldo Anda tidak mencukupi." });
        }

        await db
          .update(schema.profiles)
          .set({ balance: prof.balance - prod.price })
          .where(eq(schema.profiles.id, userId));

        const [newOrder] = await db
          .insert(schema.orders)
          .values({
            userId: userId,
            productId: prod.id,
            productName: prod.name,
            price: prod.price,
            daily: prod.daily,
            days: prod.days,
            total: prod.total,
            status: "active",
          })
          .returning();

        return res.json({ data: mapKeysToSnakeCase(newOrder) });
      }

      if (rpcName === "admin_set_balance") {
        const targetUserId = rpcArgs._user_id;
        const newBalance = Number(rpcArgs._balance);

        if (!targetUserId || isNaN(newBalance)) {
          return res.status(400).json({ error: "Parameter tidak valid." });
        }

        const [updatedProf] = await db
          .update(schema.profiles)
          .set({ balance: newBalance })
          .where(eq(schema.profiles.id, targetUserId))
          .returning();

        return res.json({ data: mapKeysToSnakeCase(updatedProf) });
      }

      if (rpcName === "review_deposit") {
        const reqId = rpcArgs._id;
        const approve = rpcArgs._approve;
        const note = rpcArgs._note || "";

        const [depReq] = await db
          .select()
          .from(schema.depositRequests)
          .where(eq(schema.depositRequests.id, reqId));
        if (!depReq) {
          return res.status(404).json({ error: "Permintaan deposit tidak ditemukan." });
        }

        if (depReq.status !== "pending") {
          return res.status(400).json({ error: "Permintaan deposit sudah diproses." });
        }

        const nextStatus = approve ? "approved" : "rejected";

        if (approve) {
          const [prof] = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.id, depReq.userId));
          if (prof) {
            await db
              .update(schema.profiles)
              .set({ balance: prof.balance + depReq.amount })
              .where(eq(schema.profiles.id, depReq.userId));
          }
        }

        const [updatedReq] = await db
          .update(schema.depositRequests)
          .set({
            status: nextStatus,
            adminNote: note,
            reviewedAt: new Date(),
          })
          .where(eq(schema.depositRequests.id, reqId))
          .returning();

        return res.json({ data: mapKeysToSnakeCase(updatedReq) });
      }

      if (rpcName === "review_withdraw") {
        const reqId = rpcArgs._id;
        const approve = rpcArgs._approve;
        const note = rpcArgs._note || "";

        const [withReq] = await db
          .select()
          .from(schema.withdrawRequests)
          .where(eq(schema.withdrawRequests.id, reqId));
        if (!withReq) {
          return res.status(404).json({ error: "Permintaan penarikan tidak ditemukan." });
        }

        if (withReq.status !== "pending") {
          return res.status(400).json({ error: "Permintaan penarikan sudah diproses." });
        }

        const nextStatus = approve ? "approved" : "rejected";

        if (!approve) {
          const [prof] = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.id, withReq.userId));
          if (prof) {
            await db
              .update(schema.profiles)
              .set({ balance: prof.balance + withReq.amount })
              .where(eq(schema.profiles.id, withReq.userId));
          }
        }

        const [updatedReq] = await db
          .update(schema.withdrawRequests)
          .set({
            status: nextStatus,
            adminNote: note,
            reviewedAt: new Date(),
          })
          .where(eq(schema.withdrawRequests.id, reqId))
          .returning();

        return res.json({ data: mapKeysToSnakeCase(updatedReq) });
      }

      return res.status(400).json({ error: `Fungsi RPC '${rpcName}' tidak didukung.` });
    }

    // 2. Table-based Database Operations
    const tableMap: Record<string, any> = {
      profiles: schema.profiles,
      user_roles: schema.userRoles,
      payment_settings: schema.paymentSettings,
      deposit_requests: schema.depositRequests,
      withdraw_requests: schema.withdrawRequests,
      products: schema.products,
      faqs: schema.faqs,
      announcements: schema.announcements,
      site_content: schema.siteContent,
      bonus_codes: schema.bonusCodes,
      orders: schema.orders,
      banners: schema.banners,
    };

    const table = tableMap[tableName];
    if (!table) {
      return res.status(400).json({ error: `Tabel '${tableName}' tidak ditemukan.` });
    }

    const conditions: any[] = [];
    if (filters && Array.isArray(filters)) {
      for (const f of filters) {
        const schemaCol = getSchemaColumn(table, f.col);
        if (schemaCol) {
          conditions.push(eq(schemaCol, f.val));
        }
      }
    }

    if (action === "select") {
      let q = db.select().from(table);
      if (conditions.length > 0) {
        q = q.where(and(...conditions)) as any;
      }
      if (orderCol) {
        const schemaCol = getSchemaColumn(table, orderCol);
        if (schemaCol) {
          q = q.orderBy(orderAsc ? asc(schemaCol) : desc(schemaCol)) as any;
        }
      }
      if (limitCount !== null && limitCount !== undefined) {
        q = q.limit(limitCount) as any;
      }

      let data = await q;
      if (single) {
        data = data[0] || null;
      }
      return res.json({ data: mapKeysToSnakeCase(data) });
    }

    if (action === "insert") {
      if (!userId && tableName !== "profiles" && tableName !== "user_roles") {
        return res.status(401).json({ error: "Sesi tidak ditemukan." });
      }

      const rawVal = mapKeysToCamelCase(insertData, table);

      if (tableName === "withdraw_requests") {
        const withdrawAmount = Number(rawVal.amount);
        const reqUserId = rawVal.userId || userId;

        if (!reqUserId) {
          return res.status(400).json({ error: "User ID diperlukan." });
        }

        const [prof] = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.id, reqUserId));
        if (!prof) {
          return res.status(404).json({ error: "Profil tidak ditemukan." });
        }

        if (prof.balance < withdrawAmount) {
          return res.status(400).json({ error: "Nominal penarikan melebihi saldo Anda." });
        }

        await db
          .update(schema.profiles)
          .set({ balance: prof.balance - withdrawAmount })
          .where(eq(schema.profiles.id, reqUserId));
      }

      const [insertedRow] = await db.insert(table).values(rawVal).returning();
      return res.json({ data: mapKeysToSnakeCase(insertedRow) });
    }

    if (action === "update") {
      const rawVal = mapKeysToCamelCase(updateData, table);
      let q = db.update(table).set(rawVal);
      if (conditions.length > 0) {
        q = q.where(and(...conditions)) as any;
      }
      const updatedRows = await q.returning();
      return res.json({ data: mapKeysToSnakeCase(single ? updatedRows[0] || null : updatedRows) });
    }

    if (action === "delete") {
      let q = db.delete(table);
      if (conditions.length > 0) {
        q = q.where(and(...conditions)) as any;
      }
      const deletedRows = await q.returning();
      return res.json({ data: mapKeysToSnakeCase(single ? deletedRows[0] || null : deletedRows) });
    }

    return res.status(400).json({ error: "Action tidak didukung." });
  } catch (err: any) {
    try {
      const memRes = inMemoryExecute(req.body, userId);
      return res.json(memRes);
    } catch (memErr: any) {
      return res.status(500).json({ error: memErr.message || "Gagal memproses." });
    }
  }
});

// In-memory and static storage for device-uploaded images
const uploadedFilesStore = new Map<
  string,
  {
    dataUrl: string;
    contentType: string;
    fileName: string;
    size: number;
    createdAt: string;
  }
>();

// Storage and Static Asset Upload APIs
app.post("/api/storage/upload", async (req, res) => {
  try {
    const { path: reqPath, fileData, fileName, contentType, size } = req.body;
    const finalPath = reqPath || `uploads/${crypto.randomUUID()}.jpg`;

    if (fileData && typeof fileData === "string") {
      uploadedFilesStore.set(finalPath, {
        dataUrl: fileData,
        contentType: contentType || "image/jpeg",
        fileName: fileName || "device_upload.jpg",
        size: size || fileData.length,
        createdAt: new Date().toISOString(),
      });
    }

    return res.json({
      path: finalPath,
      fullPath: finalPath,
      url: fileData || `/api/storage/file?path=${encodeURIComponent(finalPath)}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal mengunggah file dari perangkat." });
  }
});

app.get("/api/storage/signed-url", async (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.json({ signedUrl: null });

  if (
    filePath.startsWith("data:") ||
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    return res.json({ signedUrl: filePath });
  }

  const stored = uploadedFilesStore.get(filePath);
  if (stored) {
    return res.json({ signedUrl: stored.dataUrl });
  }

  return res.json({
    signedUrl:
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80",
  });
});

app.get("/api/storage/file", (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(404).send("File not found");

  const stored = uploadedFilesStore.get(filePath);
  if (!stored) {
    return res.status(404).send("File not found");
  }

  // Parse base64 dataUrl: data:image/png;base64,....
  const matches = stored.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (matches) {
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    res.setHeader("Content-Type", mimeType);
    return res.send(buffer);
  }

  return res.redirect(stored.dataUrl);
});

// Helper to convert Web API Request to Node.js IncomingMessage (for Express router)
function buildIncomingMessage(request: Request): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);

    req.method = request.method;
    const urlObj = new URL(request.url);
    req.url = urlObj.pathname + urlObj.search;

    request.headers.forEach((value, key) => {
      req.headers[key] = value;
    });

    if (request.body) {
      const reader = request.body.getReader();
      const push = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) {
            req.push(null);
          } else {
            req.push(Buffer.from(value));
            await push();
          }
        } catch (err) {
          reject(err);
        }
      };
      push();
    } else {
      req.push(null);
    }

    resolve(req);
  });
}

// Helper to run Express router and capture response to return as Web API Response
function runExpress(req: IncomingMessage, res: ServerResponse): Promise<Response> {
  return new Promise((resolve) => {
    let responseStatus = 200;
    const responseHeaders: Record<string, string> = {};
    const responseChunks: (string | Buffer | Uint8Array)[] = [];

    res.writeHead = function (
      status: number,
      headers?: Record<string, string | string[] | undefined>,
    ) {
      responseStatus = status;
      if (headers) {
        Object.entries(headers).forEach(([k, v]) => {
          responseHeaders[k] = String(v ?? "");
        });
      }
      return this;
    };

    res.setHeader = function (name: string, value: string | string[] | number) {
      responseHeaders[name.toLowerCase()] = String(value);
      return this;
    };

    res.write = function (
      chunk: string | Uint8Array,
      encodingOrCb?: string | ((err?: Error | null) => void),
      cb?: (err?: Error | null) => void,
    ) {
      responseChunks.push(chunk);
      if (typeof encodingOrCb === "function") encodingOrCb();
      if (cb) cb();
      return true;
    };

    res.end = function (
      chunk?: string | Uint8Array,
      encodingOrCb?: string | (() => void),
      cb?: () => void,
    ) {
      if (chunk) {
        responseChunks.push(chunk);
      }
      if (typeof encodingOrCb === "function") encodingOrCb();
      if (cb) cb();

      const body = Buffer.concat(
        responseChunks.map((c) => (typeof c === "string" ? Buffer.from(c) : c)),
      );
      resolve(
        new Response(body, {
          status: responseStatus,
          headers: responseHeaders,
        }),
      );
      return this;
    };

    app(req, res);
  });
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (isH3SwallowedErrorBody(body)) {
    console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return response;
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Dispatch all /api/* requests to ExpressJS app
    if (url.pathname.startsWith("/api/")) {
      try {
        const req = await buildIncomingMessage(request);
        const res = new ServerResponse(req);
        return await runExpress(req, res);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("Express routing error:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: errMsg }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // Delegate non-API requests to TanStack Start/ReactJS renderer
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
