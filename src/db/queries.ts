import { query, queryOne, execute } from './client';
import type { Server, PetState, InteractionLog, InteractionType } from '@/types';

/**
 * Get or create a server record
 * If the server doesn't exist, create it with a default pet name
 */
export const getOrCreateServer = async (serverId: string): Promise<Server> => {
  // Try to get existing server
  const existingServer = await queryOne(
    `SELECT id, server_id as "serverId", pet_name as "petName", created_at as "createdAt", updated_at as "updatedAt"
     FROM servers
     WHERE server_id = $1`,
    [serverId]
  ) as Server | null;

  if (existingServer) {
    return existingServer;
  }

  // Create new server with default pet name
  const defaultPetName = 'Bot Pet';
  const newServer = await queryOne(
    `INSERT INTO servers (server_id, pet_name)
     VALUES ($1, $2)
     RETURNING id, server_id as "serverId", pet_name as "petName", created_at as "createdAt", updated_at as "updatedAt"`,
    [serverId, defaultPetName]
  ) as Server;

  return newServer;
};

/**
 * Get the pet's name for a server
 */
export const getPetName = async (serverId: string): Promise<string | null> => {
  const result = await queryOne(
    `SELECT pet_name as "petName" FROM servers WHERE server_id = $1`,
    [serverId]
  ) as { petName: string } | null;

  return result?.petName ?? null;
};

/**
 * Update the pet's name for a server
 */
export const updatePetName = async (serverId: string, newName: string): Promise<void> => {
  await execute(
    `UPDATE servers SET pet_name = $1, updated_at = CURRENT_TIMESTAMP WHERE server_id = $2`,
    [newName, serverId]
  );
};

/**
 * Get or create pet state for a server
 */
export const getOrCreatePetState = async (serverId: string): Promise<PetState> => {
  // Try to get existing pet state
  const existingState = await queryOne(
    `SELECT id, server_id as "serverId", hunger, happiness, energy, mood,
            last_interaction_at as "lastInteractionAt",
            last_fed_at as "lastFedAt",
            last_played_at as "lastPlayedAt",
            last_talked_at as "lastTalkedAt",
            last_petted_at as "lastPettedAt",
            updated_at as "updatedAt"
     FROM pet_states
     WHERE server_id = $1`,
    [serverId]
  ) as PetState | null;

  if (existingState) {
    return existingState;
  }

  // Create new pet state with defaults
  const newState = await queryOne(
    `INSERT INTO pet_states (server_id, hunger, happiness, energy, mood)
     VALUES ($1, 50, 50, 50, 'content')
     RETURNING id, server_id as "serverId", hunger, happiness, energy, mood,
               last_interaction_at as "lastInteractionAt",
               last_fed_at as "lastFedAt",
               last_played_at as "lastPlayedAt",
               last_talked_at as "lastTalkedAt",
               last_petted_at as "lastPettedAt",
               updated_at as "updatedAt"`,
    [serverId]
  ) as PetState;

  return newState;
};

/**
 * Update pet state with partial updates
 * Only updates the fields provided in the updates object
 */
export const updatePetState = async (
  serverId: string,
  updates: Partial<Omit<PetState, 'id' | 'serverId'>>
): Promise<void> => {
  const updateFields: string[] = [];
  const values: unknown[] = [serverId];
  let paramIndex = 2;

  // Map the field names from camelCase to snake_case
  const fieldMapping: Record<string, string> = {
    hunger: 'hunger',
    happiness: 'happiness',
    energy: 'energy',
    mood: 'mood',
    lastInteractionAt: 'last_interaction_at',
    lastFedAt: 'last_fed_at',
    lastPlayedAt: 'last_played_at',
    lastTalkedAt: 'last_talked_at',
    lastPettedAt: 'last_petted_at',
    updatedAt: 'updated_at',
  };

  // Build dynamic update query
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && fieldMapping[key]) {
      updateFields.push(`${fieldMapping[key]} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  // Always update the updated_at timestamp
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

  if (updateFields.length === 1) {
    // Only updated_at, so just update that
    await execute(
      `UPDATE pet_states SET updated_at = CURRENT_TIMESTAMP WHERE server_id = $1`,
      [serverId]
    );
    return;
  }

  const updateQuery = `UPDATE pet_states SET ${updateFields.join(', ')} WHERE server_id = $1`;
  await execute(updateQuery, values);
};

/**
 * Log a user interaction with the pet
 */
export const logInteraction = async (
  serverId: string,
  userId: string,
  action: InteractionType
): Promise<void> => {
  await execute(
    `INSERT INTO interaction_logs (server_id, user_id, action)
     VALUES ($1, $2, $3)`,
    [serverId, userId, action]
  );
};

/**
 * Get the last interaction time for a specific user and action
 * Returns timestamp or null if no interaction found
 */
export const getLastInteractionTime = async (
  serverId: string,
  userId: string,
  action: InteractionType
): Promise<Date | null> => {
  const result = await queryOne(
    `SELECT created_at as "timestamp" FROM interaction_logs
     WHERE server_id = $1 AND user_id = $2 AND action = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [serverId, userId, action]
  ) as { timestamp: Date } | null;

  return result?.timestamp ?? null;
};

/**
 * Get all servers (useful for cron jobs)
 */
export const getAllServers = async (): Promise<Server[]> => {
  const servers = await query(
    `SELECT id, server_id as "serverId", pet_name as "petName", created_at as "createdAt", updated_at as "updatedAt"
     FROM servers
     ORDER BY created_at ASC`
  ) as Server[];

  return servers;
};

/**
 * Get all pet states (useful for cron jobs and global updates)
 */
export const getAllPetStates = async (): Promise<PetState[]> => {
  const states = await query(
    `SELECT id, server_id as "serverId", hunger, happiness, energy, mood,
            last_interaction_at as "lastInteractionAt",
            last_fed_at as "lastFedAt",
            last_played_at as "lastPlayedAt",
            last_talked_at as "lastTalkedAt",
            last_petted_at as "lastPettedAt",
            updated_at as "updatedAt"
     FROM pet_states
     ORDER BY updated_at ASC`
  ) as PetState[];

  return states;
};
