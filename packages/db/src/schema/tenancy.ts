import { boolean, foreignKey, pgTable, text, unique, uuid, index } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./columns.js";

export const organization = pgTable("organization", {
  id: id(),
  name: text().notNull(),
  legalName: text(),
  taxId: text(),
  address: text(),
  phone: text(),
  email: text(),
  logoUrl: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const zone = pgTable(
  "zone",
  {
    id: id(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id),
    name: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("zone_org_name_uq").on(t.organizationId, t.name),
    unique("zone_id_org_uq").on(t.id, t.organizationId),
  ],
);

export const salesPoint = pgTable(
  "sales_point",
  {
    id: id(),
    organizationId: uuid().notNull(),
    zoneId: uuid().notNull(),
    name: text().notNull(),
    address: text(),
    active: boolean().notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({
      name: "sales_point_zone_org_fk",
      columns: [t.zoneId, t.organizationId],
      foreignColumns: [zone.id, zone.organizationId],
    }),
    unique("sales_point_org_name_uq").on(t.organizationId, t.name),
    unique("sales_point_id_org_uq").on(t.id, t.organizationId),
  ],
);

export const customer = pgTable(
  "customer",
  {
    id: id(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id),
    fullName: text(),
    phone: text(),
    createdAt: createdAt(),
  },
  (t) => [index("customer_org_idx").on(t.organizationId)],
);
