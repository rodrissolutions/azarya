import { sql } from "drizzle-orm";
import { type AnyPgColumn, timestamp, uuid } from "drizzle-orm/pg-core";

export const id = () =>
  uuid()
    .primaryKey()
    .default(sql`uuidv7()`);

export const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/** CHECK "columna in (...)" a partir de una lista de constantes del dominio. */
export const inList = (column: AnyPgColumn, values: readonly string[]) =>
  sql`${column} in (${sql.raw(values.map((v) => `'${v}'`).join(", "))})`;
