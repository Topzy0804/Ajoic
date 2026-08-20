ALTER TYPE "public"."group_frequency" ADD VALUE 'custom';--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "custom_frequency_days" integer;