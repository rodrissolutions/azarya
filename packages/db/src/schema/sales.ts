import { PaymentMethod, SaleStatus } from "@azarya/contracts";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { createdAt, id, inList } from "./columns.js";
import { appUser } from "./identity.js";
import { inventoryItem } from "./inventory.js";
import { customer, salesPoint } from "./tenancy.js";
import { event } from "./events.js";

export const sale = pgTable(
  "sale",
  {
    id: id(),
    organizationId: uuid().notNull(),
    eventId: uuid().notNull(),
    salesPointId: uuid().notNull(),
    sellerId: uuid()
      .notNull()
      .references(() => appUser.id),
    customerId: uuid().references(() => customer.id),
    paymentMethod: text().notNull(),
    totalCents: integer().notNull(),
    status: text().notNull().default("activa"),
    idempotencyKey: text().notNull(),
    voidedAt: timestamp({ withTimezone: true }),
    voidedBy: uuid().references(() => appUser.id),
    voidReason: text(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "sale_event_org_fk",
      columns: [t.eventId, t.organizationId],
      foreignColumns: [event.id, event.organizationId],
    }),
    foreignKey({
      name: "sale_sales_point_org_fk",
      columns: [t.salesPointId, t.organizationId],
      foreignColumns: [salesPoint.id, salesPoint.organizationId],
    }),
    unique("sale_id_org_uq").on(t.id, t.organizationId),
    unique("sale_org_idempotency_uq").on(t.organizationId, t.idempotencyKey),
    index("sale_event_idx").on(t.eventId),
    index("sale_sales_point_idx").on(t.salesPointId),
    check("sale_payment_method_ck", inList(t.paymentMethod, PaymentMethod.options)),
    check("sale_status_ck", inList(t.status, SaleStatus.options)),
    check("sale_total_ck", sql`${t.totalCents} >= 0`),
    check(
      "sale_void_ck",
      sql`${t.status} <> 'anulada' or (${t.voidedAt} is not null and ${t.voidedBy} is not null)`,
    ),
  ],
);

export const saleItem = pgTable(
  "sale_item",
  {
    id: id(),
    organizationId: uuid().notNull(),
    saleId: uuid().notNull(),
    inventoryItemId: uuid().notNull(),
    priceCents: integer().notNull(),
    active: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "sale_item_sale_org_fk",
      columns: [t.saleId, t.organizationId],
      foreignColumns: [sale.id, sale.organizationId],
    }),
    foreignKey({
      name: "sale_item_item_org_fk",
      columns: [t.inventoryItemId, t.organizationId],
      foreignColumns: [inventoryItem.id, inventoryItem.organizationId],
    }),
    index("sale_item_sale_idx").on(t.saleId),
    uniqueIndex("sale_item_active_item_uq")
      .on(t.inventoryItemId)
      .where(sql`${t.active}`),
    check("sale_item_price_ck", sql`${t.priceCents} >= 0`),
  ],
);
