import { describe, it, expect, vi } from 'vitest';
import { messages, getRandomMessage, formatStatus } from '../messages.js';

describe('Messages Library', () => {
  describe('messages object', () => {
    it('should have all required categories', () => {
      expect(messages).toHaveProperty('feed');
      expect(messages).toHaveProperty('play');
      expect(messages).toHaveProperty('talk');
      expect(messages).toHaveProperty('pet');
      expect(messages).toHaveProperty('random_happy');
      expect(messages).toHaveProperty('random_sad');
      expect(messages).toHaveProperty('random_tired');
    });

    it('should have at least 5 messages in each category', () => {
      Object.entries(messages).forEach(([category, msgs]) => {
        expect(msgs.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('should have all messages as strings', () => {
      Object.entries(messages).forEach(([category, msgs]) => {
        msgs.forEach((msg) => {
          expect(typeof msg).toBe('string');
          expect(msg.length).toBeGreaterThan(0);
        });
      });
    });

    it('should contain charming and personality-driven messages', () => {
      // Check that feed category has adorable eating messages
      expect(messages.feed.some((msg) => msg.includes('nom') || msg.includes('munch'))).toBe(true);

      // Check that play category has fun messages
      expect(messages.play.some((msg) => msg.includes('zoom') || msg.includes('spin'))).toBe(true);

      // Check that pet category has affectionate messages
      expect(messages.pet.some((msg) => msg.includes('purr') || msg.includes('nuzzle') || msg.includes('love'))).toBe(true);
    });
  });

  describe('getRandomMessage()', () => {
    it('should return a string from the feed category', () => {
      const msg = getRandomMessage('feed');
      expect(typeof msg).toBe('string');
      expect(messages.feed).toContain(msg);
    });

    it('should return a string from the play category', () => {
      const msg = getRandomMessage('play');
      expect(typeof msg).toBe('string');
      expect(messages.play).toContain(msg);
    });

    it('should return a string from the talk category', () => {
      const msg = getRandomMessage('talk');
      expect(typeof msg).toBe('string');
      expect(messages.talk).toContain(msg);
    });

    it('should return a string from the pet category', () => {
      const msg = getRandomMessage('pet');
      expect(typeof msg).toBe('string');
      expect(messages.pet).toContain(msg);
    });

    it('should return a string from the random_happy category', () => {
      const msg = getRandomMessage('random_happy');
      expect(typeof msg).toBe('string');
      expect(messages.random_happy).toContain(msg);
    });

    it('should return a string from the random_sad category', () => {
      const msg = getRandomMessage('random_sad');
      expect(typeof msg).toBe('string');
      expect(messages.random_sad).toContain(msg);
    });

    it('should return a string from the random_tired category', () => {
      const msg = getRandomMessage('random_tired');
      expect(typeof msg).toBe('string');
      expect(messages.random_tired).toContain(msg);
    });

    it('should return different messages on multiple calls (statistically)', () => {
      const calls = new Set<string>();
      for (let i = 0; i < 20; i++) {
        calls.add(getRandomMessage('feed'));
      }
      // With 8+ messages and 20 calls, we should get at least 2 different ones
      expect(calls.size).toBeGreaterThan(1);
    });

    it('should handle fallback gracefully for unknown key', () => {
      const msg = getRandomMessage('unknown' as keyof typeof messages);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  describe('formatStatus()', () => {
    it('should include pet name in output', () => {
      const output = formatStatus('Fluffy', 50, 50, 50, 'content');
      expect(output).toContain('Fluffy');
      expect(output).toContain('Status');
    });

    it('should include all stat labels', () => {
      const output = formatStatus('Spot', 50, 50, 50, 'content');
      expect(output).toContain('Hunger');
      expect(output).toContain('Happiness');
      expect(output).toContain('Energy');
      expect(output).toContain('Mood');
    });

    it('should include progress bars with filled characters', () => {
      const output = formatStatus('Buddy', 50, 50, 50, 'content');
      expect(output).toContain('█');
      expect(output).toContain('░');
    });

    it('should display correct percentages', () => {
      const output = formatStatus('Max', 50, 75, 25, 'content');
      expect(output).toContain('50%');
      expect(output).toContain('75%');
      expect(output).toContain('25%');
    });

    it('should show full bar for 100% stats', () => {
      const output = formatStatus('Buddy', 100, 100, 100, 'content');
      expect(output).toContain('██████████');
      expect(output).toContain('100%');
    });

    it('should show empty bar for 0% stats', () => {
      const output = formatStatus('Buddy', 0, 0, 0, 'content');
      expect(output).toContain('░░░░░░░░░░');
      expect(output).toContain('  0%');
    });

    it('should show partial bars for intermediate values', () => {
      // 30% should have 3 filled, 7 empty
      const output = formatStatus('Buddy', 30, 30, 30, 'content');
      const lines = output.split('\n');
      // Should have bars with some filled and some empty
      expect(output).toContain('█');
      expect(output).toContain('░');
      expect(output).toContain('30%');
    });

    it('should include mood emoji for all moods', () => {
      const moods = ['starving', 'sad', 'exhausted', 'playful', 'content'];
      const emojis = ['😭', '😢', '😴', '🎉', '🌟'];

      moods.forEach((mood, idx) => {
        const output = formatStatus('Pet', 50, 50, 50, mood);
        expect(output).toContain(mood);
        expect(output).toContain(emojis[idx]);
      });
    });

    it('should clamp hunger to 0-100', () => {
      const output150 = formatStatus('Buddy', 150, 50, 50, 'content');
      expect(output150).toContain('100%');

      const outputNeg = formatStatus('Buddy', -50, 50, 50, 'content');
      expect(outputNeg).toContain('  0%');
    });

    it('should clamp happiness to 0-100', () => {
      const output150 = formatStatus('Buddy', 50, 150, 50, 'content');
      const lines = output150.split('\n');
      // Find happiness line and check for 100%
      expect(output150).toContain('100%');

      const outputNeg = formatStatus('Buddy', 50, -50, 50, 'content');
      expect(outputNeg).toContain('  0%');
    });

    it('should clamp energy to 0-100', () => {
      const output150 = formatStatus('Buddy', 50, 50, 150, 'content');
      expect(output150).toContain('100%');

      const outputNeg = formatStatus('Buddy', 50, 50, -50, 'content');
      expect(outputNeg).toContain('  0%');
    });

    it('should format output with proper line breaks', () => {
      const output = formatStatus('Buddy', 50, 50, 50, 'content');
      const lines = output.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(5);
      // Should have: title, hunger, happiness, energy, mood
      expect(lines[0]).toContain('Buddy');
      expect(lines[1]).toContain('Hunger');
      expect(lines[2]).toContain('Happiness');
      expect(lines[3]).toContain('Energy');
      expect(lines[4]).toContain('Mood');
    });

    it('should show bold text for pet name and mood', () => {
      const output = formatStatus('Fluffy', 50, 50, 50, 'happy');
      expect(output).toContain('**Fluffy');
      expect(output).toContain('**happy**');
    });

    it('should handle edge case of exactly 50 in all stats', () => {
      const output = formatStatus('Mid', 50, 50, 50, 'content');
      expect(output).toContain('50%');
      expect(output).toContain('█████░░░░░');
    });
  });
});
