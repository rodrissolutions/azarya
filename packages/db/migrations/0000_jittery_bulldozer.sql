CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"is_superadmin" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_status_ck" CHECK ("app_user"."status" in ('activo', 'desactivado'))
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"zone_id" uuid,
	"sales_point_id" uuid,
	"status" text DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_org_user_uq" UNIQUE("organization_id","user_id"),
	CONSTRAINT "membership_role_ck" CHECK ("membership"."role" in ('organizador', 'gestor_zona', 'vendedor', 'verificador')),
	CONSTRAINT "membership_status_ck" CHECK ("membership"."status" in ('activo', 'desactivado')),
	CONSTRAINT "membership_gestor_zone_ck" CHECK ("membership"."role" <> 'gestor_zona' or "membership"."zone_id" is not null),
	CONSTRAINT "membership_vendedor_point_ck" CHECK ("membership"."role" <> 'vendedor' or "membership"."sales_point_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"full_name" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"tax_id" text,
	"address" text,
	"phone" text,
	"email" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_point" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_point_org_name_uq" UNIQUE("organization_id","name"),
	CONSTRAINT "sales_point_id_org_uq" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "zone" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zone_org_name_uq" UNIQUE("organization_id","name"),
	CONSTRAINT "zone_id_org_uq" UNIQUE("id","organization_id")
);
--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_zone_org_fk" FOREIGN KEY ("zone_id","organization_id") REFERENCES "public"."zone"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_sales_point_org_fk" FOREIGN KEY ("sales_point_id","organization_id") REFERENCES "public"."sales_point"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_point" ADD CONSTRAINT "sales_point_zone_org_fk" FOREIGN KEY ("zone_id","organization_id") REFERENCES "public"."zone"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zone" ADD CONSTRAINT "zone_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_user_email_lower_uq" ON "app_user" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "membership_user_idx" ON "membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_org_idx" ON "customer" USING btree ("organization_id");