/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./index";
import { eq } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seedDatabase() {
  console.log("🌱 Starting database seed...");
  try {
    const adminEmail = "admin@menara.com";
    const userEmail = "user@menara.com";
    const demoPassword = hashPassword("Menara123!");

    // Check & Seed Admin Profile
    const [adminProf] = await db.select().from(schema.profiles).where(eq(schema.profiles.email, adminEmail));
    let adminId = adminProf?.id;
    if (!adminProf) {
      const [newAdmin] = await db.insert(schema.profiles).values({
        email: adminEmail,
        fullName: "Administrator",
        password: demoPassword,
        balance: 100000000,
      }).returning();
      adminId = newAdmin.id;
      console.log("[Seed] Admin profile created successfully.");
    }

    // Check & Seed Admin Role
    if (adminId) {
      const [adminRole] = await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, adminId));
      if (!adminRole) {
        await db.insert(schema.userRoles).values({
          userId: adminId,
          role: "admin",
        });
        console.log("[Seed] Admin role assigned successfully.");
      }
    }

    // Check & Seed User Profile
    const [userProf] = await db.select().from(schema.profiles).where(eq(schema.profiles.email, userEmail));
    let userId = userProf?.id;
    if (!userProf) {
      const [newUser] = await db.insert(schema.profiles).values({
        email: userEmail,
        fullName: "Demo Investor",
        password: demoPassword,
        balance: 500000,
      }).returning();
      userId = newUser.id;
      console.log("[Seed] User profile created successfully.");
    }

    // Check & Seed User Role
    if (userId) {
      const [userRole] = await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, userId));
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
        bankInstruction: "Transfer ke rekening BCA 1234567890 a/n Velocity Driver, lalu unggah bukti transfer di bawah.",
        depositEnabled: true,
        withdrawEnabled: true,
        depositStart: "08:00",
        depositEnd: "21:00",
        withdrawStart: "08:00",
        withdrawEnd: "17:00",
        minDeposit: 75000,
        minWithdraw: 50000,
      });
      console.log("[Seed] Default payment settings seeded successfully.");
    }

    // Check & Seed Default Products
    const [existingProduct] = await db.select().from(schema.products);
    if (!existingProduct) {
      const defaultProducts = [
        { name: "DRIVER 01", price: 75000, daily: 10250, total: 615000, days: 60, type: "REGULER", active: true, sort: 1 },
        { name: "DRIVER 02", price: 100000, daily: 13667, total: 820000, days: 60, type: "REGULER", active: true, sort: 2 },
        { name: "DRIVER 03", price: 250000, daily: 34167, total: 2050000, days: 60, type: "REGULER", active: true, sort: 3 },
        { name: "DRIVER 04", price: 500000, daily: 68333, total: 4100000, days: 60, type: "REGULER", active: true, sort: 4 },
        { name: "DRIVER 05", price: 1000000, daily: 135000, total: 8100000, days: 60, type: "REGULER", active: true, sort: 5 },
        { name: "DRIVER 06", price: 2000000, daily: 273333, total: 16400000, days: 60, type: "REGULER", active: true, sort: 6 },
        { name: "DRIVER 07", price: 3000000, daily: 410000, total: 24600000, days: 60, type: "REGULER", active: true, sort: 7 },
        { name: "DRIVER 08", price: 3500000, daily: 478333, total: 28700000, days: 60, type: "REGULER", active: true, sort: 8 },
        { name: "DRIVER 09", price: 4000000, daily: 546667, total: 32800000, days: 60, type: "REGULER", active: true, sort: 9 },
        { name: "DRIVER 10", price: 5000000, daily: 683333, total: 41000000, days: 60, type: "REGULER", active: true, sort: 10 },
        { name: "PROMO 1", price: 100000, daily: 50000, total: 500000, days: 10, type: "VIP", active: true, sort: 11 },
        { name: "PROMO 2", price: 500000, daily: 250000, total: 2500000, days: 10, type: "VIP", active: true, sort: 12 },
        { name: "PROMO 3", price: 1000000, daily: 500000, total: 5000000, days: 10, type: "VIP", active: true, sort: 13 },
      ];
      for (const p of defaultProducts) {
        await db.insert(schema.products).values(p);
      }
      console.log("[Seed] Default products seeded successfully.");
    }

    console.log("✅ Database seed completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database seeding failed:", err);
    process.exit(1);
  }
}

seedDatabase();
