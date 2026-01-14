import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const EntityIdSchema = z.string().uuid();
export type EntityId = z.infer<typeof EntityIdSchema>;

export function generateEntityId(): string {
  return uuidv4();
}

export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createBaseEntity(): Omit<Entity, 'id'> {
  const now = new Date();
  return {
    createdAt: now,
    updatedAt: now,
  };
}

export function updateBaseEntity(entity: Entity): Entity {
  return {
    ...entity,
    updatedAt: new Date(),
  };
}

export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export async function tryCatch<T, E = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    return success(await fn());
  } catch (error) {
    return failure(error as E);
  }
}
