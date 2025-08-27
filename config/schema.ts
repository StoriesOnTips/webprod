import {
  integer,
  json,
  pgTable,
  serial,
  text,
  varchar,
  uniqueIndex,
  index,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

// ====================== Story Data Table ======================
export const StoryData = pgTable(
  "storyData",
  {
    id: serial("id").primaryKey(),
    storyId: varchar("storyId", { length: 50 }).notNull(),
    storySubject: text("storySubject").notNull(),
    storyType: varchar("storyType", { length: 50 }).notNull(),
    ageGroup: varchar("ageGroup", { length: 50 }).notNull(),
    imageStyle: varchar("imageStyle", { length: 50 }),
    output: json("output"),
    coverImage: varchar("coverImage", { length: 500 }),
    clerkUserId: varchar("clerkUserId", { length: 50 }).notNull(),
    userEmail: varchar("userEmail", { length: 255 }).notNull(),
    userName: varchar("userName", { length: 100 }).notNull(),
    userImage: varchar("userImage", { length: 500 }),
    language1: varchar("language1", { length: 50 }).notNull(), // Mother tongue
    language2: varchar("language2", { length: 50 }).notNull(), // Learning language
    genre: varchar("genre", { length: 50 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    storyIdUnique: uniqueIndex("story_id_unique").on(table.storyId),
    storyIdIdx: index("story_id_idx").on(table.storyId),
    clerkUserIdIdx: index("clerk_user_id_idx").on(table.clerkUserId),
    userEmailIdx: index("user_email_idx").on(table.userEmail),
    lang2Idx: index("language2_idx").on(table.language2),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
    // Composite index for user dashboard queries
    userLangDateIdx: index("user_lang_date_idx").on(
      table.clerkUserId,
      table.language2,
      table.createdAt
    ),
  })
);

// ====================== Users Table ======================
export const Users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkUserId: varchar("clerkUserId", { length: 50 }).notNull(),
    userName: varchar("userName", { length: 100 }).notNull(),
    userEmail: varchar("userEmail", { length: 255 }).notNull(),
    userImage: varchar("userImage", { length: 500 }),

    // onboarding
    onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
    onboardingCompletedAt: timestamp("onboardingCompletedAt"), 
    firstName: varchar("firstName", { length: 50 }).notNull(),
    lastName: varchar("lastName", { length: 50 }).notNull(),
    motherTongue: varchar("motherTongue", { length: 50 }).notNull(),
    preferredAgeGroup: varchar("preferredAgeGroup", { length: 20 }).notNull(),
    primaryGoal: varchar("primaryGoal", { length: 50 }).notNull(),
    storyFrequency: varchar("storyFrequency", { length: 30 }).notNull(),
    preferredImageStyle: varchar("preferredImageStyle", {
      length: 30,
    }).notNull(),

    // Dashboard stats
    totalStoriesCreated: integer("totalStoriesCreated").default(0).notNull(),
    monthlyStoriesCreated: integer("monthlyStoriesCreated")
      .default(0)
      .notNull(),
    lastMonthlyReset: timestamp("lastMonthlyReset").defaultNow().notNull(),
    languageStreaks: jsonb("languageStreaks").default({}).notNull(),

    credits: integer("credits").default(3).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.userEmail),
    clerkIdUnique: uniqueIndex("users_clerk_id_unique").on(table.clerkUserId),
  })
);

// ====================== Compensation / Retry Events ======================
export const CompensationEvents = pgTable(
  "compensation_events",
  {
    id: serial("id").primaryKey(),
    requestId: varchar("requestId", { length: 64 }).notNull(),
    clerkUserId: varchar("clerkUserId", { length: 50 }).notNull(),
    storyId: varchar("storyId", { length: 50 }),
    eventType: varchar("eventType", { length: 50 }).notNull(), 
    status: varchar("status", { length: 30 }).notNull(),
    reason: text("reason"),
    error: text("error"),
    payload: jsonb("payload"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    requestIdx: index("comp_events_request_idx").on(table.requestId),
    userIdx: index("comp_events_user_idx").on(table.clerkUserId),
    storyIdx: index("comp_events_story_idx").on(table.storyId),
    statusIdx: index("comp_events_status_idx").on(table.status),
    createdAtIdx: index("comp_events_created_idx").on(table.createdAt),
  })
);

// ====================== Payment Transaction Table ======================
export const PaymentTransaction = pgTable(
  "payment_transactions",
  {
    id: serial("id").primaryKey(),
    userId: varchar("userId", { length: 50 }).notNull(),
    orderId: varchar("orderId", { length: 100 }).notNull(),
    captureId: varchar("captureId", { length: 100 }),
    amount: varchar("amount", { length: 20 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    rawPayload: jsonb("rawPayload").notNull(), 
    verifiedAt: timestamp("verifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    orderIdUnique: uniqueIndex("payment_order_id_unique").on(table.orderId),
    userIdIdx: index("payment_user_id_idx").on(table.userId),
    statusIdx: index("payment_status_idx").on(table.status),
    verifiedAtIdx: index("payment_verified_at_idx").on(table.verifiedAt),
    createdAtIdx: index("payment_created_at_idx").on(table.createdAt),
  })
);

// ====================== Payment Audit Log Table ======================
export const PaymentAuditLog = pgTable(
  "payment_audit_logs",
  {
    id: serial("id").primaryKey(),
    transactionId: integer("transactionId").notNull().references(() => PaymentTransaction.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    previousStatus: varchar("previousStatus", { length: 50 }),
    newStatus: varchar("newStatus", { length: 50 }).notNull(),
    changedBy: varchar("changedBy", { length: 50 }).notNull(),
    reason: text("reason"),
    occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  },
  (table) => ({
    transactionIdx: index("audit_transaction_idx").on(table.transactionId),
    statusIdx: index("audit_status_idx").on(table.newStatus),
    occurredAtIdx: index("audit_occurred_at_idx").on(table.occurredAt),
  })
);