import { AllocationAction, InventoryStatus } from "@azarya/contracts";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, inList, updatedAt } from "./columns.js";
import { batch, event } from "./events.js";
import { appUser } from "./identity.js";
import { salesPoint } from "./tenancy.js";

export const inventoryItem = pgTable(
  "inventory_item",
  {
    id: id(),
    organizationId: uuid().notNull(),
    eventId: uuid().notNull(),
    batchId: uuid().notNull(),
    serial: text().notNull(),
    uniqueKey: text(),
    status: text().notNull().default("disponible"),
    salesPointId: uuid(),
    reservedUntil: timestamp({ withTimezone: true }),
    priceCents: integer().notNull(),
    payload: jsonb().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({
      name: "inventory_item_event_org_fk",
      columns: [t.eventId, t.organizationId],
      foreignColumns: [event.id, event.organizationId],
    }),
    foreignKey({
      name: "inventory_item_batch_org_fk",
      columns: [t.batchId, t.organizationId],
      foreignColumns: [batch.id, batch.organizationId],
    }),
    foreignKey({
      name: "inventory_item_sales_point_org_fk",
      columns: [t.salesPointId, t.organizationId],
      foreignColumns: [salesPoint.id, salesPoint.organizationId],
    }),
    unique("inventory_item_id_org_uq").on(t.id, t.organizationId),
    unique("inventory_item_event_serial_uq").on(t.eventId, t.serial),
    unique("inventory_item_event_unique_key_uq").on(t.eventId, t.uniqueKey),
    index("inventory_item_event_status_idx").on(t.eventId, t.status),
    index("inventory_item_sales_point_idx").on(t.salesPointId),
    index("inventory_item_batch_idx").on(t.batchId),
    check("inventory_item_status_ck", inList(t.status, InventoryStatus.options)),
    check("inventory_item_price_ck", sql`${t.priceCents} >= 0`),
    check(
      "inventory_item_disponible_ck",
      sql`${t.status} <> 'disponible' or (${t.salesPointId} is null and ${t.reservedUntil} is null)`,
    ),
    check(
      "inventory_item_asignada_ck",
      sql`${t.status} <> 'asignada' or ${t.salesPointId} is not null`,
    ),
    check(
      "inventory_item_reservada_ck",
      sql`${t.status} <> 'reservada' or (${t.salesPointId} is not null and ${t.reservedUntil} is not null)`,
    ),
  ],
);

export const allocation = pgTable(
  "allocation",
  {
    id: id(),
    organizationId: uuid().notNull(),
    inventoryItemId: uuid().notNull(),
    salesPointId: uuid().notNull(),
    action: text().notNull(),
    performedBy: uuid()
      .notNull()
      .references(() => appUser.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "allocation_item_org_fk",
      columns: [t.inventoryItemId, t.organizationId],
      foreignColumns: [inventoryItem.id, inventoryItem.organizationId],
    }),
    foreignKey({
      name: "allocation_sales_point_org_fk",
      columns: [t.salesPointId, t.organizationId],
      foreignColumns: [salesPoint.id, salesPoint.organizationId],
    }),
    index("allocation_item_idx").on(t.inventoryItemId),
    index("allocation_sales_point_idx").on(t.salesPointId),
    check("allocation_action_ck", inList(t.action, AllocationAction.options)),
  ],
);
