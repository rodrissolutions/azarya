import { OrganizationRole, RecordStatus } from "@azarya/contracts";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { createdAt, id, inList, updatedAt } from "./columns.js";
import { organization, salesPoint, zone } from "./tenancy.js";

export const appUser = pgTable(
  "app_user",
  {
    id: id(),
    email: text().notNull(),
    passwordHash: text().notNull(),
    fullName: text().notNull(),
    isSuperadmin: boolean().notNull().default(false),
    status: text().notNull().default("activo"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("app_user_email_lower_uq").on(sql`lower(${t.email})`),
    check("app_user_status_ck", inList(t.status, RecordStatus.options)),
  ],
);

export const membership = pgTable(
  "membership",
  {
    id: id(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id),
    userId: uuid()
      .notNull()
      .references(() => appUser.id),
    role: text().notNull(),
    zoneId: uuid(),
    salesPointId: uuid(),
    status: text().notNull().default("activo"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("membership_org_user_uq").on(t.organizationId, t.userId),
    foreignKey({
      name: "membership_zone_org_fk",
      columns: [t.zoneId, t.organizationId],
      foreignColumns: [zone.id, zone.organizationId],
    }),
    foreignKey({
      name: "membership_sales_point_org_fk",
      columns: [t.salesPointId, t.organizationId],
      foreignColumns: [salesPoint.id, salesPoint.organizationId],
    }),
    check("membership_role_ck", inList(t.role, OrganizationRole.options)),
    check("membership_status_ck", inList(t.status, RecordStatus.options)),
    check("membership_gestor_zone_ck", sql`${t.role} <> 'gestor_zona' or ${t.zoneId} is not null`),
    check(
      "membership_vendedor_point_ck",
      sql`${t.role} <> 'vendedor' or ${t.salesPointId} is not null`,
    ),
    index("membership_user_idx").on(t.userId),
  ],
);
