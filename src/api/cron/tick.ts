import { getAllPetStates, updatePetState } from '@/db/queries';
import { applyStatDecay, getRandomEvent, calculateMood } from '@/utils/pet-state';
import type { PetState } from '@/types';

/**
 * Cron Job: Pet State Decay
 *
 * Runs every 5 minutes to:
 * 1. Apply stat decay to all pets (hunger +5, happiness -1, energy +3)
 * 2. Roll random events (grumpy, finds pebble, naps)
 * 3. Update database with new states
 *
 * Protected by CRON_SECRET header verification
 */
export default async (req: Request): Promise<Response> => {
  try {
    // Only accept GET requests from Vercel cron
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify CRON_SECRET header
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable not set');
      return new Response(
        JSON.stringify({ error: 'Server misconfigured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Invalid CRON_SECRET');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🐾 Starting pet tick...');

    // Query all pet states
    const allPets = await getAllPetStates();

    if (allPets.length === 0) {
      console.log('✓ No pets to update');
      return new Response(
        JSON.stringify({ success: true, updated: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let updatedCount = 0;

    // Process each pet
    for (const pet of allPets) {
      try {
        // Apply stat decay
        const decayed = applyStatDecay(pet);

        // Roll random event
        const event = getRandomEvent();
        let eventApplied = null;

        if (event === 'pet_grumpy') {
          decayed.happiness = Math.max((decayed.happiness ?? pet.happiness) - 10, 0);
          eventApplied = 'pet_grumpy';
        } else if (event === 'pet_finds_pebble') {
          decayed.happiness = Math.min((decayed.happiness ?? pet.happiness) + 5, 100);
          eventApplied = 'pet_finds_pebble';
        } else if (event === 'pet_naps') {
          decayed.energy = Math.min((decayed.energy ?? pet.energy) + 10, 100);
          eventApplied = 'pet_naps';
        }

        // Recalculate mood after random events
        const updatedState = {
          ...pet,
          hunger: decayed.hunger ?? pet.hunger,
          happiness: decayed.happiness ?? pet.happiness,
          energy: decayed.energy ?? pet.energy,
        };

        decayed.mood = calculateMood(updatedState);

        // Update database
        await updatePetState(pet.serverId, decayed);

        const hungerChange = (decayed.hunger ?? pet.hunger) - pet.hunger;
        const happinessChange = (decayed.happiness ?? pet.happiness) - pet.happiness;
        const energyChange = (decayed.energy ?? pet.energy) - pet.energy;

        const oldHunger = pet.hunger;
        const newHunger = decayed.hunger ?? pet.hunger;

        const eventStr = eventApplied ? ` [${eventApplied}]` : '';
        console.log(
          `✓ Updated pet in server ${pet.serverId}: ` +
          `hunger ${oldHunger}→${newHunger}, ` +
          `happiness ${pet.happiness}→${decayed.happiness}, ` +
          `energy ${pet.energy}→${decayed.energy}, ` +
          `mood ${pet.mood}${eventStr}`
        );

        updatedCount++;
      } catch (error) {
        console.error(`✗ Failed to update pet in server ${pet.serverId}:`, error);
        // Continue processing other pets on error
      }
    }

    console.log(`✓ Tick complete. Updated ${updatedCount} pets.`);

    return new Response(
      JSON.stringify({ success: true, updated: updatedCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Cron tick failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
