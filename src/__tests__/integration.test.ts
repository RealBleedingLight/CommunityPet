import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getOrCreateServer,
  getPetName,
  updatePetName,
  getOrCreatePetState,
  updatePetState,
  logInteraction,
} from '@/db/queries';
import { applyStatDecay } from '@/utils/pet-state';
import type { PetState, Server } from '@/types';

// Mock the database client
vi.mock('@/db/client', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
}));

import * as dbClient from '@/db/client';

describe('Community Pet - Integration Tests', () => {
  const testServerId = 'test-server-' + Date.now();
  let mockQueryOne: ReturnType<typeof vi.fn>;
  let mockExecute: ReturnType<typeof vi.fn>;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQueryOne = vi.mocked(dbClient.queryOne);
    mockExecute = vi.mocked(dbClient.execute);
    mockQuery = vi.mocked(dbClient.query);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Server Management', () => {
    it('should create a server and pet on first interaction', async () => {
      // Mock the first call (no existing server) returning null
      mockQueryOne.mockResolvedValueOnce(null);
      // Mock the INSERT returning the new server
      mockQueryOne.mockResolvedValueOnce({
        id: '1',
        serverId: testServerId,
        petName: 'Bot Pet',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const server = await getOrCreateServer(testServerId);

      expect(server.serverId).toBe(testServerId);
      expect(server.petName).toBe('Bot Pet');
      expect(server.id).toBeDefined();
    });

    it('should return existing server on subsequent calls', async () => {
      const existingServer: Server = {
        id: 'existing-1',
        serverId: testServerId,
        petName: 'Fluffy',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryOne.mockResolvedValueOnce(existingServer);

      const server = await getOrCreateServer(testServerId);

      expect(server.serverId).toBe(testServerId);
      expect(server.petName).toBe('Fluffy');
    });
  });

  describe('Pet Naming', () => {
    it('should allow renaming the pet', async () => {
      mockExecute.mockResolvedValueOnce(undefined);

      await updatePetName(testServerId, 'Whiskers');

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE servers SET pet_name'),
        [expect.any(String), testServerId]
      );
    });

    it('should retrieve the pet name', async () => {
      mockQueryOne.mockResolvedValueOnce({ petName: 'Whiskers' });

      const name = await getPetName(testServerId);

      expect(name).toBe('Whiskers');
    });

    it('should return null if pet name does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const name = await getPetName(testServerId);

      expect(name).toBeNull();
    });
  });

  describe('Pet State Management', () => {
    it('should create a pet with default stats on first interaction', async () => {
      // Mock no existing pet state
      mockQueryOne.mockResolvedValueOnce(null);
      // Mock the INSERT returning new pet state
      mockQueryOne.mockResolvedValueOnce({
        id: 'pet-1',
        serverId: testServerId,
        hunger: 50,
        happiness: 50,
        energy: 50,
        mood: 'content',
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      });

      const petState = await getOrCreatePetState(testServerId);

      expect(petState.serverId).toBe(testServerId);
      expect(petState.hunger).toBe(50);
      expect(petState.happiness).toBe(50);
      expect(petState.energy).toBe(50);
      expect(petState.mood).toBe('content');
    });

    it('should return existing pet state on subsequent calls', async () => {
      const existingPetState: PetState = {
        id: 'pet-existing',
        serverId: testServerId,
        hunger: 65,
        happiness: 45,
        energy: 72,
        mood: 'playful',
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryOne.mockResolvedValueOnce(existingPetState);

      const petState = await getOrCreatePetState(testServerId);

      expect(petState.serverId).toBe(testServerId);
      expect(petState.hunger).toBe(65);
      expect(petState.happiness).toBe(45);
      expect(petState.energy).toBe(72);
      expect(petState.mood).toBe('playful');
    });

    it('should update pet state with partial updates', async () => {
      mockExecute.mockResolvedValueOnce(undefined);

      await updatePetState(testServerId, {
        hunger: 30,
        happiness: 80,
        mood: 'playful',
      });

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE pet_states SET'),
        expect.arrayContaining([testServerId])
      );
    });

    it('should handle empty updates gracefully', async () => {
      mockExecute.mockResolvedValueOnce(undefined);

      await updatePetState(testServerId, {});

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE pet_states SET updated_at = CURRENT_TIMESTAMP'),
        [testServerId]
      );
    });

    it('should only update specified fields', async () => {
      mockExecute.mockResolvedValueOnce(undefined);

      await updatePetState(testServerId, {
        hunger: 25,
      });

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('hunger'),
        expect.arrayContaining([testServerId, 25])
      );
    });
  });

  describe('Stat Decay', () => {
    it('should apply stat decay correctly', () => {
      const state: PetState = {
        id: 'pet-1',
        serverId: testServerId,
        hunger: 30,
        happiness: 70,
        energy: 50,
        mood: 'content',
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      };

      const decayed = applyStatDecay(state);

      // Hunger should increase (gets hungrier)
      expect(decayed.hunger).toBeGreaterThan(state.hunger);
      expect(decayed.hunger).toBe(35); // 30 + 5

      // Happiness should decrease (gets sadder)
      expect(decayed.happiness).toBeLessThan(state.happiness);
      expect(decayed.happiness).toBe(69); // 70 - 1

      // Energy should increase (gets more rested)
      expect(decayed.energy).toBeGreaterThan(state.energy);
      expect(decayed.energy).toBe(53); // 50 + 3
    });

    it('should cap hunger at 100', () => {
      const state: PetState = {
        id: 'pet-1',
        serverId: testServerId,
        hunger: 98,
        happiness: 50,
        energy: 50,
        mood: 'starving',
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      };

      const decayed = applyStatDecay(state);

      expect(decayed.hunger).toBe(100); // Capped at 100
    });

    it('should cap happiness at 0', () => {
      const state: PetState = {
        id: 'pet-1',
        serverId: testServerId,
        hunger: 50,
        happiness: 0,
        energy: 50,
        mood: 'sad',
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      };

      const decayed = applyStatDecay(state);

      expect(decayed.happiness).toBe(0); // Stays at 0
    });

    it('should cap energy at 100', () => {
      const state: PetState = {
        id: 'pet-1',
        serverId: testServerId,
        hunger: 50,
        happiness: 50,
        energy: 99,
        mood: 'content',
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      };

      const decayed = applyStatDecay(state);

      expect(decayed.energy).toBe(100); // Capped at 100
    });

    it('should update mood based on decayed stats', () => {
      const state: PetState = {
        id: 'pet-1',
        serverId: testServerId,
        hunger: 66, // Will become 71 after decay (> 70 = starving)
        happiness: 50,
        energy: 50,
        mood: 'content',
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      };

      const decayed = applyStatDecay(state);

      // After decay: hunger = 71 (> 70) => starving mood
      expect(decayed.mood).toBe('starving');
    });
  });

  describe('Interaction Logging', () => {
    it('should log feed interactions', async () => {
      mockExecute.mockResolvedValueOnce(undefined);

      await logInteraction(testServerId, 'user-123', 'feed');

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO interaction_logs'),
        [testServerId, 'user-123', 'feed']
      );
    });

    it('should log play interactions', async () => {
      mockExecute.mockResolvedValueOnce(undefined);

      await logInteraction(testServerId, 'user-456', 'play');

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO interaction_logs'),
        [testServerId, 'user-456', 'play']
      );
    });

    it('should log talk interactions', async () => {
      mockExecute.mockResolvedValueOnce(undefined);

      await logInteraction(testServerId, 'user-789', 'talk');

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO interaction_logs'),
        [testServerId, 'user-789', 'talk']
      );
    });

    it('should log pet interactions', async () => {
      mockExecute.mockResolvedValueOnce(undefined);

      await logInteraction(testServerId, 'user-101', 'pet');

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO interaction_logs'),
        [testServerId, 'user-101', 'pet']
      );
    });

    it('should handle multiple interactions from different users', async () => {
      mockExecute.mockResolvedValue(undefined);

      await logInteraction(testServerId, 'user-1', 'feed');
      await logInteraction(testServerId, 'user-2', 'play');
      await logInteraction(testServerId, 'user-3', 'talk');

      expect(mockExecute).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration Flow', () => {
    it('should handle a complete user interaction flow', async () => {
      // Step 1: Create server
      mockQueryOne.mockResolvedValueOnce(null);
      mockQueryOne.mockResolvedValueOnce({
        id: 'server-1',
        serverId: testServerId,
        petName: 'Bot Pet',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const server = await getOrCreateServer(testServerId);
      expect(server.serverId).toBe(testServerId);

      // Step 2: Create pet state
      mockQueryOne.mockResolvedValueOnce(null);
      mockQueryOne.mockResolvedValueOnce({
        id: 'pet-1',
        serverId: testServerId,
        hunger: 50,
        happiness: 50,
        energy: 50,
        mood: 'content',
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      });

      const petState = await getOrCreatePetState(testServerId);
      expect(petState.hunger).toBe(50);
      expect(petState.happiness).toBe(50);
      expect(petState.energy).toBe(50);

      // Step 3: Log interaction
      mockExecute.mockResolvedValueOnce(undefined);
      await logInteraction(testServerId, 'user-123', 'feed');

      expect(mockExecute).toHaveBeenCalled();

      // Step 4: Update pet state after interaction
      mockExecute.mockResolvedValueOnce(undefined);
      await updatePetState(testServerId, {
        hunger: 40,
        happiness: 60,
      });

      expect(mockExecute).toHaveBeenCalled();

      // Step 5: Apply stat decay
      const decayedState = applyStatDecay(petState);
      expect(decayedState.hunger).toBeGreaterThan(petState.hunger);
      expect(decayedState.happiness).toBeLessThan(petState.happiness);
    });

    it('should allow pet renaming in the flow', async () => {
      // Create server
      mockQueryOne.mockResolvedValueOnce(null);
      mockQueryOne.mockResolvedValueOnce({
        id: 'server-1',
        serverId: testServerId,
        petName: 'Bot Pet',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await getOrCreateServer(testServerId);

      // Rename pet
      mockExecute.mockResolvedValueOnce(undefined);
      await updatePetName(testServerId, 'Whiskers');

      // Get new name
      mockQueryOne.mockResolvedValueOnce({ petName: 'Whiskers' });
      const name = await getPetName(testServerId);

      expect(name).toBe('Whiskers');
    });
  });
});
