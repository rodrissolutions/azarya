import type { z } from "zod";
import type { GameType } from "./enums.js";
import type { EventId, InventoryItemId, RoundId } from "./ids.js";

/** Se lanza cuando un juego aún no implementa una capacidad. Falla fuerte, nunca en silencio. */
export class NotImplementedError extends Error {
  constructor(game: GameType, capability: string) {
    super(`El juego "${game}" todavía no implementa "${capability}".`);
    this.name = "NotImplementedError";
  }
}

export interface GenerateInventoryInput<TConfig> {
  eventId: EventId;
  config: TConfig;
  quantity: number;
  /** Misma semilla + mismos datos = mismo resultado. Da trazabilidad y reproducibilidad. */
  seed: string;
}

export interface GeneratedItem<TPayload> {
  serial: string;
  payload: TPayload;
}

export interface DrawPlanInput<TConfig> {
  eventId: EventId;
  roundId: RoundId;
  config: TConfig;
  seed: string;
}

export interface DrawPlan {
  /** Orden en que se revelarán los números del sorteo. */
  steps: readonly number[];
}

export interface SoldItem<TPayload> {
  itemId: InventoryItemId;
  serial: string;
  payload: TPayload;
}

export interface EvaluateWinnersInput<TConfig, TPayload> {
  roundId: RoundId;
  config: TConfig;
  drawnNumbers: readonly number[];
  soldItems: readonly SoldItem<TPayload>[];
}

export interface WinnerResult {
  itemId: InventoryItemId;
  serial: string;
}

/**
 * Contrato que implementa cada juego. Todas las operaciones son funciones puras:
 * reciben datos y devuelven datos, sin tocar la base de datos. El núcleo decide
 * cuándo persistir.
 */
export interface GameModule<TConfig, TPayload> {
  readonly type: GameType;
  readonly configSchema: z.ZodType<TConfig>;
  generateInventory(input: GenerateInventoryInput<TConfig>): readonly GeneratedItem<TPayload>[];
  createDrawPlan(input: DrawPlanInput<TConfig>): DrawPlan;
  evaluateWinners(input: EvaluateWinnersInput<TConfig, TPayload>): readonly WinnerResult[];
}
