import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateMood,
  applyStatDecay,
  getRandomEvent,
  shouldWanderToChannel,
} from '../pet-state.js';
import { getAsciiArt } from '../ascii-art.js';
import type { PetState } from '../../types/index.js';

describe('Pet State Logic', () => {
  let basePetState: PetState;

  beforeEach(() => {
    basePetState = {
      id: 'test-pet',
      serverId: 'test-server',
      hunger: 50,
      happiness: 50,
      energy: 50,
      mood: 'content',
      lastInteractionAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('calculateMood()', () => {
    it('should return "starving" when hunger > 70', () => {
      const state = { ...basePetState, hunger: 75 };
      expect(calculateMood(state)).toBe('starving');
    });

    it('should return "sad" when happiness < 30', () => {
      const state = { ...basePetState, happiness: 25 };
      expect(calculateMood(state)).toBe('sad');
    });

    it('should return "exhausted" when energy < 20', () => {
      const state = { ...basePetState, energy: 15 };
      expect(calculateMood(state)).toBe('exhausted');
    });

    it('should return "playful" when energy > 80 and happiness > 60', () => {
      const state = { ...basePetState, energy: 85, happiness: 65 };
      expect(calculateMood(state)).toBe('playful');
    });

    it('should return "playful" when energy is exactly 81 and happiness is exactly 61', () => {
      const state = { ...basePetState, energy: 81, happiness: 61 };
      expect(calculateMood(state)).toBe('playful');
    });

    it('should return "content" as default mood', () => {
      const state = { ...basePetState, hunger: 50, happiness: 50, energy: 50 };
      expect(calculateMood(state)).toBe('content');
    });

    it('should prioritize starving over other moods', () => {
      const state = {
        ...basePetState,
        hunger: 80,
        happiness: 70,
        energy: 90,
      };
      expect(calculateMood(state)).toBe('starving');
    });

    it('should prioritize sad over playful', () => {
      const state = {
        ...basePetState,
        hunger: 40,
        happiness: 20,
        energy: 90,
      };
      expect(calculateMood(state)).toBe('sad');
    });

    it('should prioritize exhausted over content', () => {
      const state = {
        ...basePetState,
        hunger: 50,
        happiness: 50,
        energy: 15,
      };
      expect(calculateMood(state)).toBe('exhausted');
    });
  });

  describe('applyStatDecay()', () => {
    it('should increase hunger by 5', () => {
      const state = { ...basePetState, hunger: 50 };
      const result = applyStatDecay(state);
      expect(result.hunger).toBe(55);
    });

    it('should decrease happiness by 1', () => {
      const state = { ...basePetState, happiness: 50 };
      const result = applyStatDecay(state);
      expect(result.happiness).toBe(49);
    });

    it('should increase energy by 3', () => {
      const state = { ...basePetState, energy: 50 };
      const result = applyStatDecay(state);
      expect(result.energy).toBe(53);
    });

    it('should cap hunger at 100', () => {
      const state = { ...basePetState, hunger: 97 };
      const result = applyStatDecay(state);
      expect(result.hunger).toBe(100);
    });

    it('should cap happiness at 0', () => {
      const state = { ...basePetState, happiness: 0 };
      const result = applyStatDecay(state);
      expect(result.happiness).toBe(0);
    });

    it('should cap energy at 100', () => {
      const state = { ...basePetState, energy: 98 };
      const result = applyStatDecay(state);
      expect(result.energy).toBe(100);
    });

    it('should recalculate mood after stat changes', () => {
      const state = { ...basePetState, hunger: 66, happiness: 50, energy: 50 };
      const result = applyStatDecay(state);
      // hunger becomes 71 (66 + 5), which should trigger starving
      expect(result.mood).toBe('starving');
    });

    it('should update the updatedAt timestamp', () => {
      const state = { ...basePetState };
      const before = new Date();
      const result = applyStatDecay(state);
      const after = new Date();

      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.updatedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return all stat fields', () => {
      const state = { ...basePetState };
      const result = applyStatDecay(state);

      expect(result).toHaveProperty('hunger');
      expect(result).toHaveProperty('happiness');
      expect(result).toHaveProperty('energy');
      expect(result).toHaveProperty('mood');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('getRandomEvent()', () => {
    it('should return null, pet_grumpy, pet_finds_pebble, or pet_naps', () => {
      // Test multiple times to cover different random outcomes
      const events = new Set<string | null>();
      for (let i = 0; i < 1000; i++) {
        const event = getRandomEvent();
        if (event) {
          events.add(event);
        }
      }

      // We should see a mix of events and nulls across 1000 rolls
      expect(events.size).toBeGreaterThan(0);
    });

    it('should have pet_grumpy in possible outcomes', () => {
      // Mock Math.random to return 0.02 (2%), which should trigger pet_grumpy (0-5%)
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.02);
      const event = getRandomEvent();
      expect(event).toBe('pet_grumpy');
      vi.restoreAllMocks();
    });

    it('should have pet_finds_pebble in possible outcomes', () => {
      // Mock Math.random to return 0.07 (7%), which should trigger pet_finds_pebble (5-10%)
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.07);
      const event = getRandomEvent();
      expect(event).toBe('pet_finds_pebble');
      vi.restoreAllMocks();
    });

    it('should have pet_naps in possible outcomes', () => {
      // Mock Math.random to return 0.12 (12%), which should trigger pet_naps (10-15%)
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.12);
      const event = getRandomEvent();
      expect(event).toBe('pet_naps');
      vi.restoreAllMocks();
    });

    it('should return null for non-event roll', () => {
      // Mock Math.random to return 0.5 (50%), which should be null
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.5);
      const event = getRandomEvent();
      expect(event).toBeNull();
      vi.restoreAllMocks();
    });
  });

  describe('shouldWanderToChannel()', () => {
    it('should return false when happiness <= 50', () => {
      const state = { ...basePetState, happiness: 50 };
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.1);
      const result = shouldWanderToChannel(state);
      expect(result).toBe(false);
      vi.restoreAllMocks();
    });

    it('should return false when happiness > 50 but random check fails', () => {
      const state = { ...basePetState, happiness: 75 };
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.5);
      const result = shouldWanderToChannel(state);
      expect(result).toBe(false);
      vi.restoreAllMocks();
    });

    it('should return true when happiness > 50 and random check succeeds', () => {
      const state = { ...basePetState, happiness: 75 };
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.1);
      const result = shouldWanderToChannel(state);
      expect(result).toBe(true);
      vi.restoreAllMocks();
    });

    it('should return true when happiness > 50 and random is exactly 0.19', () => {
      const state = { ...basePetState, happiness: 51 };
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.19);
      const result = shouldWanderToChannel(state);
      expect(result).toBe(true);
      vi.restoreAllMocks();
    });

    it('should return false when happiness > 50 and random is exactly 0.2', () => {
      const state = { ...basePetState, happiness: 75 };
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.2);
      const result = shouldWanderToChannel(state);
      expect(result).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe('getAsciiArt()', () => {
    it('should return ASCII art for starving mood', () => {
      const art = getAsciiArt('starving');
      expect(art).toContain('HUNGRY');
      expect(typeof art).toBe('string');
    });

    it('should return ASCII art for sad mood', () => {
      const art = getAsciiArt('sad');
      expect(art).toContain('sad');
      expect(typeof art).toBe('string');
    });

    it('should return ASCII art for exhausted mood', () => {
      const art = getAsciiArt('exhausted');
      expect(art).toContain('zzz');
      expect(typeof art).toBe('string');
    });

    it('should return ASCII art for playful mood', () => {
      const art = getAsciiArt('playful');
      expect(art).toContain('WHEEE');
      expect(typeof art).toBe('string');
    });

    it('should return ASCII art for content mood', () => {
      const art = getAsciiArt('content');
      expect(art).toContain(':)');
      expect(typeof art).toBe('string');
    });

    it('should return default ASCII art for unknown mood', () => {
      const art = getAsciiArt('unknown');
      expect(typeof art).toBe('string');
      // Should return content as default
      expect(art).toBe(getAsciiArt('content'));
    });

    it('should return a non-empty string for all moods', () => {
      const moods = ['starving', 'sad', 'exhausted', 'playful', 'content'];
      moods.forEach((mood) => {
        const art = getAsciiArt(mood);
        expect(art.length).toBeGreaterThan(0);
      });
    });
  });
});
