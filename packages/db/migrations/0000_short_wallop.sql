CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'light', 'moderate', 'active', 'very_active');--> statement-breakpoint
CREATE TYPE "public"."cimit_message_type" AS ENUM('advice', 'roast', 'chat', 'recipe_comment');--> statement-breakpoint
CREATE TYPE "public"."cimit_tone" AS ENUM('soft', 'normal', 'savage');--> statement-breakpoint
CREATE TYPE "public"."eating_mode" AS ENUM('hemat', 'sehat', 'balanced');--> statement-breakpoint
CREATE TYPE "public"."food_category" AS ENUM('protein', 'vegetable', 'fruit', 'grain', 'dairy', 'fastfood', 'beverage', 'snack', 'other');--> statement-breakpoint
CREATE TYPE "public"."food_log_source" AS ENUM('vision', 'audio', 'text', 'manual', 'nearby', 'recipe', 'telegram', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('lose', 'maintain', 'gain');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'max');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."subscription_entitlement" AS ENUM('cimeat_pro', 'cimeat_max');--> statement-breakpoint
CREATE TYPE "public"."usage_feature" AS ENUM('vision', 'audio', 'text', 'recipe', 'nearby', 'cimit_advice', 'tts');--> statement-breakpoint
CREATE TABLE "cimit_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "cimit_message_type" DEFAULT 'chat' NOT NULL,
	"role" text DEFAULT 'model' NOT NULL,
	"content" text NOT NULL,
	"tone" "cimit_tone",
	"audio_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"summary_date" date NOT NULL,
	"total_calories" integer DEFAULT 0 NOT NULL,
	"total_protein_g" real DEFAULT 0 NOT NULL,
	"total_carbs_g" real DEFAULT 0 NOT NULL,
	"total_fat_g" real DEFAULT 0 NOT NULL,
	"offside_amount" integer DEFAULT 0 NOT NULL,
	"cimit_summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"food_id" uuid,
	"source" "food_log_source" DEFAULT 'manual' NOT NULL,
	"meal_type" "meal_type",
	"food_name" text NOT NULL,
	"estimated_weight_g" integer,
	"calories" integer NOT NULL,
	"protein_g" real DEFAULT 0 NOT NULL,
	"carbs_g" real DEFAULT 0 NOT NULL,
	"fat_g" real DEFAULT 0 NOT NULL,
	"health_score" integer,
	"confidence_score" real,
	"image_url" text,
	"audio_url" text,
	"note" text,
	"raw_ai_result" jsonb,
	"eaten_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "meal_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"avoid" jsonb,
	"diet_type" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "pantry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"mode" "eating_mode" DEFAULT 'balanced' NOT NULL,
	"ingredients" jsonb,
	"recipe_markdown" text NOT NULL,
	"nutrition_estimate" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text DEFAULT 'revenuecat' NOT NULL,
	"entitlement" "subscription_entitlement" NOT NULL,
	"status" text NOT NULL,
	"expires_at" timestamp with time zone,
	"raw_payload" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature" "usage_feature" NOT NULL,
	"plan_snapshot" "plan" DEFAULT 'free' NOT NULL,
	"usage_date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"active_plan" "plan" DEFAULT 'free' NOT NULL,
	"cimit_tone" "cimit_tone" DEFAULT 'normal' NOT NULL,
	"default_mode" "eating_mode" DEFAULT 'balanced' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cimit_messages" ADD CONSTRAINT "cimit_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_preferences" ADD CONSTRAINT "meal_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_locations" ADD CONSTRAINT "saved_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cimit_messages_user_created_idx" ON "cimit_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_summaries_user_date_uq" ON "daily_summaries" USING btree ("user_id","summary_date");--> statement-breakpoint
CREATE INDEX "food_logs_user_eaten_idx" ON "food_logs" USING btree ("user_id","eaten_at");--> statement-breakpoint
CREATE INDEX "food_logs_user_meal_type_idx" ON "food_logs" USING btree ("user_id","meal_type");--> statement-breakpoint
CREATE INDEX "foods_user_name_idx" ON "foods" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "pantry_items_user_name_idx" ON "pantry_items" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "recipes_user_created_idx" ON "recipes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_entitlement_uq" ON "subscriptions" USING btree ("user_id","entitlement");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_events_user_feature_date_uq" ON "usage_events" USING btree ("user_id","feature","usage_date");