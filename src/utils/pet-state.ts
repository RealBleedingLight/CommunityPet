import type { PetState } from '../types/index.js';

/**
 * Calculate the pet's mood based on current stats
 */
export const calculateMood = (state: PetState): PetState['mood'] => {
  if (state.hunger > 70) {
    return 'starving';
  }
  if (state.happiness < 30) {
    return 'sad';
  }
  if (state.energy < 20) {
    return 'exhausted';
  }
  if (state.energy > 80 && state.happiness > 60) {
    return 'playful';
  }
  return 'content';
};

/**
 * Apply per-tick stat decay (5-10 minute cycle)
 * Returns updated stats and mood
 */
export const applyStatDecay = (state: PetState): Partial<PetState> => {
  // Apply decay
  const hunger = Math.min(state.hunger + 5, 100);
  const happiness = Math.max(state.happiness - 1, 0);
  const energy = Math.min(state.energy + 3, 100);

  // Create temporary state with new values to calculate mood
  const updatedState = {
    ...state,
    hunger,
    happiness,
    energy,
  };

  const mood = calculateMood(updatedState);

  return {
    hunger,
    happiness,
    energy,
    mood,
    updatedAt: new Date(),
  };
};

/**
 * Determine if a random event should occur (5-15% chance)
 * Returns the event type or null
 */
export const getRandomEvent = (): string | null => {
  const roll = Math.random() * 100;

  if (roll < 5) {
    return 'pet_grumpy';
  }
  if (roll < 10) {
    return 'pet_finds_pebble';
  }
  if (roll < 15) {
    return 'pet_naps';
  }

  return null;
};

/**
 * Determine if pet should wander to another channel
 * Returns true if happiness > 50 and random chance succeeds (20%)
 */
export const shouldWanderToChannel = (state: PetState): boolean => {
  return state.happiness > 50 && Math.random() < 0.2;
};
