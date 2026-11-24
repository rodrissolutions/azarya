import { z } from "zod";
const entityId = <Brand extends string>(_brand: Brand) => z.uuidv7().brand<Brand>();

export const OrganizationId = entityId("OrganizationId");
export const UserId = entityId("UserId");
export const ZoneId = entityId("ZoneId");
export const SalesPointId = entityId("SalesPointId");
export const EventId = entityId("EventId");
export const RoundId = entityId("RoundId");
export const InventoryItemId = entityId("InventoryItemId");
export const SaleId = entityId("SaleId");
export const CustomerId = entityId("CustomerId");

export type OrganizationId = z.infer<typeof OrganizationId>;
export type UserId = z.infer<typeof UserId>;
export type ZoneId = z.infer<typeof ZoneId>;
export type SalesPointId = z.infer<typeof SalesPointId>;
export type EventId = z.infer<typeof EventId>;
export type RoundId = z.infer<typeof RoundId>;
export type InventoryItemId = z.infer<typeof InventoryItemId>;
export type SaleId = z.infer<typeof SaleId>;
export type CustomerId = z.infer<typeof CustomerId>;
