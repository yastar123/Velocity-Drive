import {
  pgTable,
  pgEnum,
  uuid,
  text,
  bigint,
  timestamp,
  boolean,
  integer,
  time,
} from "drizzle-orm/pg-core";
import crypto from "crypto";

export const appRole = pgEnum("app_role", ["admin", "user"]);
export const requestStatus = pgEnum("request_status", ["pending", "approved", "rejected"]);

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique(),
  fullName: text("full_name"),
  password: text("password"),
  balance: bigint("balance", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull(),
  role: appRole("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentSettings = pgTable("payment_settings", {
  id: boolean("id").primaryKey().default(true),
  qrisPath: text("qris_path"),
  qrisOwnerName: text("qris_owner_name"),
  bankInstruction: text("bank_instruction"),
  depositEnabled: boolean("deposit_enabled").notNull().default(true),
  withdrawEnabled: boolean("withdraw_enabled").notNull().default(true),
  depositStart: time("deposit_start").notNull().default("08:00"),
  depositEnd: time("deposit_end").notNull().default("21:00"),
  withdrawStart: time("withdraw_start").notNull().default("08:00"),
  withdrawEnd: time("withdraw_end").notNull().default("17:00"),
  minDeposit: bigint("min_deposit", { mode: "number" }).notNull().default(75000),
  minWithdraw: bigint("min_withdraw", { mode: "number" }).notNull().default(50000),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const depositRequests = pgTable("deposit_requests", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  method: text("method").notNull(),
  senderName: text("sender_name"),
  proofPath: text("proof_path"),
  status: requestStatus("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const withdrawRequests = pgTable("withdraw_requests", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  method: text("method").notNull(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  proofPath: text("proof_path"),
  status: requestStatus("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  price: bigint("price", { mode: "number" }).notNull().default(0),
  daily: bigint("daily", { mode: "number" }).notNull().default(0),
  total: bigint("total", { mode: "number" }).notNull().default(0),
  days: integer("days").notNull().default(30),
  type: text("type").notNull().default("REGULER"),
  imageUrl: text("image_url"),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  message: text("message").notNull(),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteContent = pgTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  label: text("label"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bonusCodes = pgTable("bonus_codes", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  amount: bigint("amount", { mode: "number" }).notNull().default(0),
  maxUses: integer("max_uses").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  price: bigint("price", { mode: "number" }).notNull().default(0),
  daily: bigint("daily", { mode: "number" }).notNull().default(0),
  days: integer("days").notNull().default(30),
  total: bigint("total", { mode: "number" }).notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const banners = pgTable("banners", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
