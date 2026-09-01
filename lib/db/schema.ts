import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  date,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


// enums

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);
export const memberStatusEnum = pgEnum("member_status", ["active", "left", "removed"]);
export const groupFrequencyEnum = pgEnum("group_frequency", [
  "daily",
  "weekly",
  "monthly",
  "custom",
]);
export const groupStatusEnum = pgEnum("group_status", ["active", "completed", "cancelled"]);
export const cyclePayoutStatusEnum = pgEnum("cycle_payout_status", ["pending", "paid"]);
export const contributionStatusEnum = pgEnum("contribution_status", [
  "pending", 
  "paid", 
  "submitted", 
  "rejected", 
  "late"
]);
export const groupPaymentMethodEnum = pgEnum("group_payment_method", ["online", "offline"]);
export const walletTxTypeEnum = pgEnum("wallet_tx_type", [
  "deposit",
  "withdrawal",
  "contribution",
  "payout",
]);
export const walletTxStatusEnum = pgEnum("wallet_tx_status", ["pending", "completed", "failed"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "cycle_started",
  "receipt_submitted",
  "receipt_confirmed",
  "receipt_rejected",
  "member_joined",
  "role_changed",
  "contribution_due",
])

// users

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatar_url"),
  walletBalance: numeric("wallet_balance", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// groups

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  contributionAmount: numeric("contribution_amount", { precision: 14, scale: 2 }).notNull(),
 frequency: groupFrequencyEnum("frequency").notNull(),
 customFrequencyDays: integer("custom_frequency_days"),
  memberCap: integer("member_cap").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  status: groupStatusEnum("status").notNull().default("active"),
  currentCycleNumber: integer("current_cycle_number").notNull().default(1),
  startDate: date("start_date"),
  paymentMethod: groupPaymentMethodEnum("payment_method").notNull().default("offline"),
  payoutAccountName: text("payout_account_name"),
  payoutAccountNumber: varchar("payout_account_number", { length: 20 }),
  payoutBankName: text("payout_bank_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// group members

export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, {onDelete: "cascade"}),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  role: memberRoleEnum("role").notNull().default("member"),
  position: integer("position").notNull(),
  status: memberStatusEnum("status").notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
},
(table) => ({
  groupPositionUnique: uniqueIndex("group_position_unique").on(table.groupId, table.position),
  groupUserUnique: uniqueIndex("group_user_unique").on(table.groupId, table.userId),
}));

// cycles

export const cycles = pgTable("cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, {onDelete: "cascade"}),
  cycleNumber: integer("cycle_number").notNull(),
  recipientMemberId: uuid("recipient_member_id")
    .notNull()
    .references(() => groupMembers.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  payoutStatus: cyclePayoutStatusEnum("payout_status").notNull().default("pending"),
  payoutAt: timestamp("payout_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


// contributions


export const contributions = pgTable("contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  cycleId: uuid("cycle_id")
    .notNull()
    .references(() => cycles.id, {onDelete: "cascade"}),
    groupMemberId: uuid("group_member_id")
    .notNull()
    .references(() => groupMembers.id),
  status: contributionStatusEnum("status").notNull().default("pending"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  receiptUrl: text("receipt_url"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
(table) => ({
  cycleMemberUnique: uniqueIndex("cycle_member_unique").on(table.cycleId, table.groupMemberId),
}));

// wallet transactions

export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: walletTxTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: walletTxStatusEnum("status").notNull().default("pending"),
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Notifications

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").references(() => groups.id, {
    onDelete: "cascade"
  }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// relations

export const usersRelations = relations(users, ({ many }) => ({
  groupMemberships: many(groupMembers),
  walletTransactions: many(walletTransactions),
  ownedGroups: many(groups),
  notifications: many(notifications),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, { fields: [groups.ownerId], references: [users.id] }),
  members: many(groupMembers),
  cycles: many(cycles),
  notifications: many(notifications),
}));

export const groupMembersRelations = relations(groupMembers, ({ one, many }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
  contributions: many(contributions),
}));

export const cyclesRelations = relations(cycles, ({ one, many }) => ({
  group: one(groups, { fields: [cycles.groupId], references: [groups.id] }),
  recipient: one(groupMembers, { fields: [cycles.recipientMemberId], references: [groupMembers.id] }),
  contributions: many(contributions),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  cycle: one(cycles, { fields: [contributions.cycleId], references: [cycles.id] }),
  member: one(groupMembers, { fields: [contributions.groupMemberId], references: [groupMembers.id] }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, { fields: [walletTransactions.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  group: one(groups, { fields: [notifications.groupId], references: [groups.id] }),
}));