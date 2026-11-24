import { fileURLToPath } from "node:url";
import pg from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

process.loadEnvFile(fileURLToPath(new URL("../../../.env", import.meta.url)));

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Falta TEST_DATABASE_URL en el .env");
if (!new URL(url).pathname.endsWith("_test")) {
  throw new Error("Los tests solo pueden correr contra una base *_test");
}

const pool = new pg.Pool({ connectionString: url, max: 2 });
let c: pg.PoolClient;

beforeAll(async () => {
  await pool.query("select 1");
});
afterAll(async () => {
  await pool.end();
});
beforeEach(async () => {
  c = await pool.connect();
  await c.query("BEGIN");
});
afterEach(async () => {
  await c.query("ROLLBACK");
  c.release();
});

async function id(text: string, params: unknown[] = []): Promise<string> {
  const res = await c.query<{ id: string }>(text, params);
  const row = res.rows[0];
  if (!row) throw new Error("La consulta no devolvió id");
  return row.id;
}

interface Seed {
  orgId: string;
  userId: string;
  zoneId: string;
  pointId: string;
  eventId: string;
  batchId: string;
}

async function seed(tag: string): Promise<Seed> {
  const orgId = await id("INSERT INTO organization (name) VALUES ($1) RETURNING id", [tag]);
  const userId = await id(
    "INSERT INTO app_user (email, password_hash, full_name) VALUES ($1, 'x', 'T') RETURNING id",
    [`${tag}@t.com`],
  );
  const zoneId = await id(
    "INSERT INTO zone (organization_id, name) VALUES ($1, 'Z') RETURNING id",
    [orgId],
  );
  const pointId = await id(
    "INSERT INTO sales_point (organization_id, zone_id, name) VALUES ($1, $2, 'P') RETURNING id",
    [orgId, zoneId],
  );
  const eventId = await id(
    "INSERT INTO event (organization_id, game_type, name, unit_price_cents, config) VALUES ($1, 'bingo', 'E', 100, '{}') RETURNING id",
    [orgId],
  );
  const batchId = await id(
    "INSERT INTO batch (organization_id, event_id, quantity, seed_commitment, created_by) VALUES ($1, $2, 2, 'h', $3) RETURNING id",
    [orgId, eventId, userId],
  );
  return { orgId, userId, zoneId, pointId, eventId, batchId };
}

function insertItem(s: Seed, serial: string, status = "disponible"): Promise<string> {
  return id(
    "INSERT INTO inventory_item (organization_id, event_id, batch_id, serial, status, price_cents, payload) VALUES ($1, $2, $3, $4, $5, 100, '{}') RETURNING id",
    [s.orgId, s.eventId, s.batchId, serial, status],
  );
}

function insertSale(s: Seed, key: string): Promise<string> {
  return id(
    "INSERT INTO sale (organization_id, event_id, sales_point_id, seller_id, payment_method, total_cents, idempotency_key) VALUES ($1, $2, $3, $4, 'efectivo', 100, $5) RETURNING id",
    [s.orgId, s.eventId, s.pointId, s.userId, key],
  );
}

function insertSaleItem(s: Seed, saleId: string, itemId: string) {
  return c.query(
    "INSERT INTO sale_item (organization_id, sale_id, inventory_item_id, price_cents) VALUES ($1, $2, $3, 100)",
    [s.orgId, saleId, itemId],
  );
}

describe("invariantes del modelo", () => {
  it("rechaza una unidad reservada sin punto de venta ni vencimiento", async () => {
    const s = await seed("a");
    await expect(insertItem(s, "A-1", "reservada")).rejects.toMatchObject({
      constraint: "inventory_item_reservada_ck",
    });
  });

  it("rechaza un serial repetido dentro del mismo evento", async () => {
    const s = await seed("a");
    await insertItem(s, "A-1");
    await expect(insertItem(s, "A-1")).rejects.toMatchObject({
      constraint: "inventory_item_event_serial_uq",
    });
  });

  it("rechaza vender la misma unidad en dos ventas activas", async () => {
    const s = await seed("a");
    const itemId = await insertItem(s, "A-1");
    const sale1 = await insertSale(s, "k1");
    const sale2 = await insertSale(s, "k2");
    await insertSaleItem(s, sale1, itemId);
    await expect(insertSaleItem(s, sale2, itemId)).rejects.toMatchObject({
      constraint: "sale_item_active_item_uq",
    });
  });

  it("rechaza una membresía de vendedor sin punto de venta", async () => {
    const s = await seed("a");
    await expect(
      c.query(
        "INSERT INTO membership (organization_id, user_id, role) VALUES ($1, $2, 'vendedor')",
        [s.orgId, s.userId],
      ),
    ).rejects.toMatchObject({ constraint: "membership_vendedor_point_ck" });
  });

  it("rechaza modificar o borrar el audit_log", async () => {
    const s = await seed("a");
    await c.query(
      "INSERT INTO audit_log (organization_id, action, entity, data, hash) VALUES ($1, 'test', 'x', '{}', 'h')",
      [s.orgId],
    );
    await c.query("SAVEPOINT s1");
    await expect(c.query("UPDATE audit_log SET action = 'otra'")).rejects.toThrow(/solo añadir/);
    await c.query("ROLLBACK TO s1");
    await expect(c.query("DELETE FROM audit_log")).rejects.toThrow(/solo añadir/);
  });

  it("rechaza modificar o borrar un draw_event", async () => {
    const s = await seed("a");
    const roundId = await id(
      "INSERT INTO round (organization_id, event_id, position, name, prize_description) VALUES ($1, $2, 1, 'R', 'Premio') RETURNING id",
      [s.orgId, s.eventId],
    );
    const drawId = await id(
      "INSERT INTO draw (organization_id, round_id, seed_commitment, created_by) VALUES ($1, $2, 'h', $3) RETURNING id",
      [s.orgId, roundId, s.userId],
    );
    await c.query(
      "INSERT INTO draw_event (organization_id, draw_id, seq, kind, data) VALUES ($1, $2, 1, 'x', '{}')",
      [s.orgId, drawId],
    );
    await c.query("SAVEPOINT s1");
    await expect(c.query("UPDATE draw_event SET kind = 'otra'")).rejects.toThrow(/solo añadir/);
    await c.query("ROLLBACK TO s1");
    await expect(c.query("DELETE FROM draw_event")).rejects.toThrow(/solo añadir/);
  });

  it("rechaza un punto de venta que apunta a la zona de otra organización", async () => {
    const a = await seed("a");
    const b = await seed("b");
    await expect(
      c.query("INSERT INTO sales_point (organization_id, zone_id, name) VALUES ($1, $2, 'X')", [
        a.orgId,
        b.zoneId,
      ]),
    ).rejects.toMatchObject({ constraint: "sales_point_zone_org_fk" });
  });
});
