CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"seq" bigint GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid,
	"data" jsonb NOT NULL,
	"prev_hash" text,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_log_seq_uq" UNIQUE("seq"),
	CONSTRAINT "audit_log_seq_ck" CHECK ("audit_log"."seq" is not null)
);
--> statement-breakpoint
CREATE TABLE "draw" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"status" text DEFAULT 'armado' NOT NULL,
	"seed_commitment" text NOT NULL,
	"seed_revealed" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "draw_round_uq" UNIQUE("round_id"),
	CONSTRAINT "draw_id_org_uq" UNIQUE("id","organization_id"),
	CONSTRAINT "draw_status_ck" CHECK ("draw"."status" in ('armado', 'en_curso', 'completado', 'cancelado')),
	CONSTRAINT "draw_revealed_ck" CHECK ("draw"."status" <> 'completado' or "draw"."seed_revealed" is not null)
);
--> statement-breakpoint
CREATE TABLE "draw_event" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"draw_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"kind" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "draw_event_draw_seq_uq" UNIQUE("draw_id","seq"),
	CONSTRAINT "draw_event_seq_ck" CHECK ("draw_event"."seq" > 0)
);
--> statement-breakpoint
CREATE TABLE "winner" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"draw_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "winner_round_item_uq" UNIQUE("round_id","inventory_item_id")
);
--> statement-breakpoint
CREATE TABLE "sale" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"sales_point_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"customer_id" uuid,
	"payment_method" text NOT NULL,
	"total_cents" integer NOT NULL,
	"status" text DEFAULT 'activa' NOT NULL,
	"idempotency_key" text NOT NULL,
	"voided_at" timestamp with time zone,
	"voided_by" uuid,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sale_id_org_uq" UNIQUE("id","organization_id"),
	CONSTRAINT "sale_org_idempotency_uq" UNIQUE("organization_id","idempotency_key"),
	CONSTRAINT "sale_payment_method_ck" CHECK ("sale"."payment_method" in ('efectivo', 'transferencia', 'otro')),
	CONSTRAINT "sale_status_ck" CHECK ("sale"."status" in ('activa', 'anulada')),
	CONSTRAINT "sale_total_ck" CHECK ("sale"."total_cents" >= 0),
	CONSTRAINT "sale_void_ck" CHECK ("sale"."status" <> 'anulada' or ("sale"."voided_at" is not null and "sale"."voided_by" is not null))
);
--> statement-breakpoint
CREATE TABLE "sale_item" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"price_cents" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sale_item_price_ck" CHECK ("sale_item"."price_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_app_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw" ADD CONSTRAINT "draw_created_by_app_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw" ADD CONSTRAINT "draw_round_org_fk" FOREIGN KEY ("round_id","organization_id") REFERENCES "public"."round"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_event" ADD CONSTRAINT "draw_event_draw_org_fk" FOREIGN KEY ("draw_id","organization_id") REFERENCES "public"."draw"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner" ADD CONSTRAINT "winner_draw_org_fk" FOREIGN KEY ("draw_id","organization_id") REFERENCES "public"."draw"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner" ADD CONSTRAINT "winner_round_org_fk" FOREIGN KEY ("round_id","organization_id") REFERENCES "public"."round"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner" ADD CONSTRAINT "winner_item_org_fk" FOREIGN KEY ("inventory_item_id","organization_id") REFERENCES "public"."inventory_item"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_seller_id_app_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_voided_by_app_user_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_event_org_fk" FOREIGN KEY ("event_id","organization_id") REFERENCES "public"."event"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_sales_point_org_fk" FOREIGN KEY ("sales_point_id","organization_id") REFERENCES "public"."sales_point"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_sale_org_fk" FOREIGN KEY ("sale_id","organization_id") REFERENCES "public"."sale"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_item_org_fk" FOREIGN KEY ("inventory_item_id","organization_id") REFERENCES "public"."inventory_item"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_org_seq_idx" ON "audit_log" USING btree ("organization_id","seq");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "winner_draw_idx" ON "winner" USING btree ("draw_id");--> statement-breakpoint
CREATE INDEX "winner_item_idx" ON "winner" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "sale_event_idx" ON "sale" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "sale_sales_point_idx" ON "sale" USING btree ("sales_point_id");--> statement-breakpoint
CREATE INDEX "sale_item_sale_idx" ON "sale_item" USING btree ("sale_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sale_item_active_item_uq" ON "sale_item" USING btree ("inventory_item_id") WHERE "sale_item"."active";