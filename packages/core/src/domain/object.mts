import type { Id } from '../types/entities/object.mjs';

/**
 * Generates a unique identifier for entities in the game.
 * @returns A unique identifier of type Id.
 */
export const createId = (): Id => crypto.randomUUID() as Id;
