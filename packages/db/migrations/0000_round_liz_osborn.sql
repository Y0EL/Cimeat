CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'light', 'moderate', 'active', 'very_active');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('telegram', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."food_category" AS ENUM('protein', 'vegetable', 'fruit', 'grain', 'dairy', 'fastfood', 'beverage', 'snack', 'other');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('lose', 'maintain', 'gain');--> statement-breakpoint
CREATE TYPE "public"."meal_source" AS ENUM('mobile', 'telegram', 'whatsapp', 'photo', 'chat', 'manual', 'recipe');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TABLE "channel_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"external_id" text NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"category" "food_category" DEFAULT 'other' NOT NULL,
	"serving_label" text DEFAULT '1 porsi' NOT NULL,
	"calories" integer NOT NULL,
	"protein" real DEFAULT 0 NOT NULL,
	"carb" real DEFAULT 0 NOT NULL,
	"fat" real DEFAULT 0 NOT NULL,
	"icon" text,
	"is_preset" boolean DEFAULT false NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linking_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"food_id" uuid,
	"meal_type" "meal_type" NOT NULL,
	"name" text NOT NULL,
	"servings" real DEFAULT 1 NOT NULL,
	"calories" integer NOT NULL,
	"protein" real DEFAULT 0 NOT NULL,
	"carb" real DEFAULT 0 NOT NULL,
	"fat" real DEFAULT 0 NOT NULL,
	"note" text,
	"photo_url" text,
	"logged_at" timestamp with time zone NOT NULL,
	"source" "meal_source" DEFAULT 'mobile' NOT NULL,
	"photo_confidence" "confidence",
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_prefs" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"meal_reminder" boolean DEFAULT true NOT NULL,
	"reminder_time" time DEFAULT '20:00' NOT NULL,
	"goal_alerts" boolean DEFAULT true NOT NULL,
	"weekly_recap" boolean DEFAULT true NOT NULL,
	"expo_push_token" text
);
--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"calorie_goal" integer NOT NULL,
	"protein_goal" real DEFAULT 0 NOT NULL,
	"carb_goal" real DEFAULT 0 NOT NULL,
	"fat_goal" real DEFAULT 0 NOT NULL,
	"goal_type" "goal_type" DEFAULT 'maintain' NOT NULL,
	"starts_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" text NOT NULL,
	"email" text,
	"name" text,
	"phone" text,
	"locale" text DEFAULT 'id-ID' NOT NULL,
	"sex" "sex",
	"birth_year" integer,
	"height_cm" real,
	"weight_kg" real,
	"activity_level" "activity_level" DEFAULT 'moderate',
	"goal_type" "goal_type" DEFAULT 'maintain',
	"is_subscribed" boolean DEFAULT false NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_sessions" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"jid" text,
	"creds" jsonb,
	"keys" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"linked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "channel_links" ADD CONSTRAINT "channel_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linking_codes" ADD CONSTRAINT "linking_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "channel_links_channel_external_uq" ON "channel_links" USING btree ("channel","external_id");--> statement-breakpoint
CREATE INDEX "coach_messages_user_created_idx" ON "coach_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "foods_user_name_idx" ON "foods" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "meals_user_logged_idx" ON "meals" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX "meals_user_meal_type_idx" ON "meals" USING btree ("user_id","meal_type");