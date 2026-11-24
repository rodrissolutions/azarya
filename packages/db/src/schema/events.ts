import { EventStatus, GameType } from "@azarya/contracts";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, inList, updatedAt } from "./columns.js";
import { appUser } from "./identity.js";
import { organization } from "./tenancy.js";

export const event = pgTable(
  "event",
  {
    id: id(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id),
    gameType: text().notNull(),
    name: text().notNull(),
    status: text().notNull().default("borrador"),
    unitPriceCents: integer().notNull(),
    currency: text().notNull().default("USD"),
    config: jsonb().notNull(),
    startsAt: timestamp({ withTimezone: true }),
    drawAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("event_id_org_uq").on(t.id, t.organizationId),
    check("event_game_type_ck", inList(t.gameType, GameType.options)),
    check("event_status_ck", inList(t.status, EventStatus.options)),
    check("event_price_ck", sql`${t.unitPriceCents} >= 0`),
    check("event_currency_ck", sql`${t.currency} = 'USD'`),
  ],
);

export const round = pgTable(
  "round",
  {
    id: id(),
    organizationId: uuid().notNull(),
    eventId: uuid().notNull(),
    position: integer().notNull(),
    name: text().notNull(),
    prizeDescription: text().notNull(),
    prizeValueCents: integer(),
    config: jsonb(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "round_event_org_fk",
      columns: [t.eventId, t.organizationId],
      foreignColumns: [event.id, event.organizationId],
    }),
    unique("round_event_position_uq").on(t.eventId, t.position),
    unique("round_id_org_uq").on(t.id, t.organizationId),
    check("round_position_ck", sql`${t.position} > 0`),
    check("round_prize_value_ck", sql`${t.prizeValueCents} is null or ${t.prizeValueCents} >= 0`),
  ],
);

export const batch = pgTable(
  "batch",
  {
    id: id(),
    organizationId: uuid().notNull(),
    eventId: uuid().notNull(),
    quantity: integer().notNull(),
    seedCommitment: text().notNull(),
    createdBy: uuid()
      .notNull()
      .references(() => appUser.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "batch_event_org_fk",
      columns: [t.eventId, t.organizationId],
      foreignColumns: [event.id, event.organizationId],
    }),
    unique("batch_id_org_uq").on(t.id, t.organizationId),
    check("batch_quantity_ck", sql`${t.quantity} > 0`),
  ],
);
