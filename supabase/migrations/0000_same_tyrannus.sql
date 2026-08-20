CREATE TYPE "public"."contribution_status" AS ENUM('pending', 'paid', 'submitted', 'rejected', 'late');--> statement-breakpoint
CREATE TYPE "public"."cycle_payout_status" AS ENUM('pending', 'paid');--> statement-breakpoint
CREATE TYPE "public"."group_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."group_payment_method" AS ENUM('online', 'offline');--> statement-breakpoint
CREATE TYPE "public"."group_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'left', 'removed');--> statement-breakpoint
CREATE TYPE "public"."wallet_tx_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."wallet_tx_type" AS ENUM('deposit', 'withdrawal', 'contribution', 'payout');--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"group_member_id" uuid NOT NULL,
	"status" "contribution_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"receipt_url" text,
	"submitted_at" timestamp with time zone,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"cycle_number" integer NOT NULL,
	"recipient_member_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"payout_status" "cycle_payout_status" DEFAULT 'pending' NOT NULL,
	"payout_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"position" integer NOT NULL,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"contribution_amount" numeric(14, 2) NOT NULL,
	"frequency" "group_frequency" NOT NULL,
	"member_cap" integer NOT NULL,
	"owner_id" uuid NOT NULL,
	"status" "group_status" DEFAULT 'active' NOT NULL,
	"current_cycle_number" integer DEFAULT 1 NOT NULL,
	"start_date" date,
	"payment_method" "group_payment_method" DEFAULT 'offline' NOT NULL,
	"payout_account_name" text,
	"payout_account_number" varchar(20),
	"payout_bank_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" varchar(20),
	"avatar_url" text,
	"wallet_balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "wallet_tx_type" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" "wallet_tx_status" DEFAULT 'pending' NOT NULL,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_cycle_id_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_group_member_id_group_members_id_fk" FOREIGN KEY ("group_member_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_recipient_member_id_group_members_id_fk" FOREIGN KEY ("recipient_member_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cycle_member_unique" ON "contributions" USING btree ("cycle_id","group_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_position_unique" ON "group_members" USING btree ("group_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "group_user_unique" ON "group_members" USING btree ("group_id","user_id");