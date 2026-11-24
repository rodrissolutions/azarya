CREATE TABLE "allocation" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"sales_point_id" uuid NOT NULL,
	"action" text NOT NULL,
	"performed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "allocation_action_ck" CHECK ("allocation"."action" in ('asignar', 'devolver'))
);
--> statement-breakpoint
CREATE TABLE "inventory_item" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"serial" text NOT NULL,
	"unique_key" text,
	"status" text DEFAULT 'disponible' NOT NULL,
	"sales_point_id" uuid,
	"reserved_until" timestamp with time zone,
	"price_cents" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_item_id_org_uq" UNIQUE("id","organization_id"),
	CONSTRAINT "inventory_item_event_serial_uq" UNIQUE("event_id","serial"),
	CONSTRAINT "inventory_item_event_unique_key_uq" UNIQUE("event_id","unique_key"),
	CONSTRAINT "inventory_item_status_ck" CHECK ("inventory_item"."status" in ('disponible', 'asignada', 'reservada', 'vendida', 'anulada')),
	CONSTRAINT "inventory_item_price_ck" CHECK ("inventory_item"."price_cents" >= 0),
	CONSTRAINT "inventory_item_disponible_ck" CHECK ("inventory_item"."status" <> 'disponible' or ("inventory_item"."sales_point_id" is null and "inventory_item"."reserved_until" is null)),
	CONSTRAINT "inventory_item_asignada_ck" CHECK ("inventory_item"."status" <> 'asignada' or "inventory_item"."sales_point_id" is not null),
	CONSTRAINT "inventory_item_reservada_ck" CHECK ("inventory_item"."status" <> 'reservada' or ("inventory_item"."sales_point_id" is not null and "inventory_item"."reserved_until" is not null))
);
--> statement-breakpoint
CREATE TABLE "batch" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"seed_commitment" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_id_org_uq" UNIQUE("id","organization_id"),
	CONSTRAINT "batch_quantity_ck" CHECK ("batch"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"game_type" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'borrador' NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"config" jsonb NOT NULL,
	"starts_at" timestamp with time zone,
	"draw_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_id_org_uq" UNIQUE("id","organization_id"),
	CONSTRAINT "event_game_type_ck" CHECK ("event"."game_type" in ('bingo', 'rifa')),
	CONSTRAINT "event_status_ck" CHECK ("event"."status" in ('borrador', 'publicado', 'en_venta', 'sorteando', 'cerrado')),
	CONSTRAINT "event_price_ck" CHECK ("event"."unit_price_cents" >= 0),
	CONSTRAINT "event_currency_ck" CHECK ("event"."currency" = 'USD')
);
--> statement-breakpoint
CREATE TABLE "round" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"prize_description" text NOT NULL,
	"prize_value_cents" integer,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "round_event_position_uq" UNIQUE("event_id","position"),
	CONSTRAINT "round_id_org_uq" UNIQUE("id","organization_id"),
	CONSTRAINT "round_position_ck" CHECK ("round"."position" > 0),
	CONSTRAINT "round_prize_value_ck" CHECK ("round"."prize_value_cents" is null or "round"."prize_value_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "allocation" ADD CONSTRAINT "allocation_performed_by_app_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation" ADD CONSTRAINT "allocation_item_org_fk" FOREIGN KEY ("inventory_item_id","organization_id") REFERENCES "public"."inventory_item"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation" ADD CONSTRAINT "allocation_sales_point_org_fk" FOREIGN KEY ("sales_point_id","organization_id") REFERENCES "public"."sales_point"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_event_org_fk" FOREIGN KEY ("event_id","organization_id") REFERENCES "public"."event"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_batch_org_fk" FOREIGN KEY ("batch_id","organization_id") REFERENCES "public"."batch"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_sales_point_org_fk" FOREIGN KEY ("sales_point_id","organization_id") REFERENCES "public"."sales_point"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_created_by_app_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_event_org_fk" FOREIGN KEY ("event_id","organization_id") REFERENCES "public"."event"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_event_org_fk" FOREIGN KEY ("event_id","organization_id") REFERENCES "public"."event"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "allocation_item_idx" ON "allocation" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "allocation_sales_point_idx" ON "allocation" USING btree ("sales_point_id");--> statement-breakpoint
CREATE INDEX "inventory_item_event_status_idx" ON "inventory_item" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "inventory_item_sales_point_idx" ON "inventory_item" USING btree ("sales_point_id");--> statement-breakpoint
CREATE INDEX "inventory_item_batch_idx" ON "inventory_item" USING btree ("batch_id");