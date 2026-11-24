import { z } from "zod";

export const GameType = z.enum(["bingo", "rifa"]);
export type GameType = z.infer<typeof GameType>;

export const EventStatus = z.enum(["borrador", "publicado", "en_venta", "sorteando", "cerrado"]);
export type EventStatus = z.infer<typeof EventStatus>;

export const InventoryStatus = z.enum([
  "disponible",
  "asignada",
  "reservada",
  "vendida",
  "anulada",
]);
export type InventoryStatus = z.infer<typeof InventoryStatus>;

export const SaleStatus = z.enum(["activa", "anulada"]);
export type SaleStatus = z.infer<typeof SaleStatus>;

export const PaymentMethod = z.enum(["efectivo", "transferencia", "otro"]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const OrganizationRole = z.enum(["organizador", "gestor_zona", "vendedor", "verificador"]);
export type OrganizationRole = z.infer<typeof OrganizationRole>;

export const RecordStatus = z.enum(["activo", "desactivado"]);
export type RecordStatus = z.infer<typeof RecordStatus>;

export const AllocationAction = z.enum(["asignar", "devolver"]);
export type AllocationAction = z.infer<typeof AllocationAction>;

export const DrawStatus = z.enum(["armado", "en_curso", "completado", "cancelado"]);
export type DrawStatus = z.infer<typeof DrawStatus>;
