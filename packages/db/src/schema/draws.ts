import { DrawStatus } from "@azarya/contracts";
import { sql } from "drizzle-orm";
import {
  bigint,
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
import { createdAt, id, inList } from "./columns.js";
import { round } from "./events.js";
import { appUser } from "./identity.js";
import { inventoryItem } from "./inventory.js";
import { organization } from "./tenancy.js";

export const draw = pgTable(
  "draw",
  {
    id: id(),
    organizationId: uuid().notNull(),
    roundId: uuid().notNull(),
    status: text().notNull().default("armado"),
    seedCommitment: text().notNull(),
    seedRevealed: text(),
    startedAt: timestamp({ withTimezone: true }),
    completedAt: timestamp({ withTimezone: true }),
    createdBy: uuid()
      .notNull()
      .references(() => appUser.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "draw_round_org_fk",
      columns: [t.roundId, t.organizationId],
      foreignColumns: [round.id, round.organizationId],
    }),
    unique("draw_round_uq").on(t.roundId),
    unique("draw_id_org_uq").on(t.id, t.organizationId),
    check("draw_status_ck", inList(t.status, DrawStatus.options)),
    check("draw_revealed_ck", sql`${t.status} <> 'completado' or ${t.seedRevealed} is not null`),
  ],
);

export const drawEvent = pgTable(
  "draw_event",
  {
    id: id(),
    organizationId: uuid().notNull(),
    drawId: uuid().notNull(),
    seq: integer().notNull(),
    kind: text().notNull(),
    data: jsonb().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "draw_event_draw_org_fk",
      columns: [t.drawId, t.organizationId],
      foreignColumns: [draw.id, draw.organizationId],
    }),
    unique("draw_event_draw_seq_uq").on(t.drawId, t.seq),
    check("draw_event_seq_ck", sql`${t.seq} > 0`),
  ],
);

export const winner = pgTable(
  "winner",
  {
    id: id(),
    organizationId: uuid().notNull(),
    drawId: uuid().notNull(),
    roundId: uuid().notNull(),
    inventoryItemId: uuid().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "winner_draw_org_fk",
      columns: [t.drawId, t.organizationId],
      foreignColumns: [draw.id, draw.organizationId],
    }),
    foreignKey({
      name: "winner_round_org_fk",
      columns: [t.roundId, t.organizationId],
      foreignColumns: [round.id, round.organizationId],
    }),
    foreignKey({
      name: "winner_item_org_fk",
      columns: [t.inventoryItemId, t.organizationId],
      foreignColumns: [inventoryItem.id, inventoryItem.organizationId],
    }),
    unique("winner_round_item_uq").on(t.roundId, t.inventoryItemId),
    index("winner_draw_idx").on(t.drawId),
    index("winner_item_idx").on(t.inventoryItemId),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    seq: bigint({ mode: "number" }).generatedAlwaysAsIdentity(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id),
    actorId: uuid().references(() => appUser.id),
    action: text().notNull(),
    entity: text().notNull(),
    entityId: uuid(),
    data: jsonb().notNull(),
    prevHash: text(),
    hash: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("audit_log_seq_uq").on(t.seq),
    index("audit_log_org_seq_idx").on(t.organizationId, t.seq),
    index("audit_log_entity_idx").on(t.entity, t.entityId),
    check("audit_log_seq_ck", sql`${t.seq} is not null`),
  ],
);
