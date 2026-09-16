import "dotenv/config";
import { db } from "./index";
import { eq, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seedDatabase() {
  console.log("🌱 Starting database seed...");
  try {
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    } catch {
      // Ignored if user has no superuser or already exists
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
          imageUrl:
            "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
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
          imageUrl:
            "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
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
          imageUrl:
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
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
          imageUrl:
            "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
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
          imageUrl:
            "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
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
          imageUrl:
            "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80",
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
          imageUrl:
            "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80",
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
          imageUrl:
            "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80",
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
          imageUrl:
            "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=800&q=80",
          active: true,
          sort: 9,
        },
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
