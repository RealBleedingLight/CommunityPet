/**
 * Message Templates Library
 * Charming and personality-driven messages for pet interactions
 */

export const messages = {
  feed: [
    "Pet munch munch! 🍖",
    "Om nom nom nom!",
    "Pet eats happily 😋",
    "Nom nom nom nooom! Pet's tail wags with delight",
    "Pet gobbles up the food like there's no tomorrow",
    "Slurp slurp! Pet smacks their lips 👅",
    "Pet dives into the food bowl with pure joy",
    "Chomp chomp chomp! Pet is in food heaven 🎉",
  ],
  play: [
    "Pet zooms around! 🏃",
    "Wheee! Pet does zoomies!",
    "Pet does a happy spin ✨",
    "Pet bounces up and down excitedly!",
    "Pet pounces on an imaginary toy 🎾",
    "Boing boing! Pet springs all over the place",
    "Pet plays peek-a-boo from behind furniture 👀",
    "Pet does a barrel roll! Wheeeee! 🌀",
  ],
  talk: [
    "Pet listens intently 👂",
    "Pet chirps back cheerfully",
    "Pet nods knowingly",
    "Pet tilts their head with curiosity 🤔",
    "Pet meows/barks in agreement",
    "Pet leans in closer to hear you better",
    "Pet makes the cutest little sound in response 💕",
    "Pet does a little affirmative head bump",
  ],
  pet: [
    "Pet purrs happily 😻",
    "Pet leans into your hand",
    "Pet nuzzles you 🥰",
    "Pet closes their eyes contentedly while being petted",
    "Pet does a little happy dance",
    "Pet rubs against you affectionately 🐾",
    "Pet lets out the sweetest little chirp of happiness",
    "Pet presses their nose against your hand gently 💖",
  ],
  random_happy: [
    "Pet does a little spin for no reason!",
    "Pet found a pebble and is very proud 💎",
    "Pet yawns adorably with a little stretch",
    "Pet does a backflip! Wait, did you see that?! 🤸",
    "Pet discovered a sunbeam and sprawls out blissfully ☀️",
    "Pet prances around like they just won something",
    "Pet catches their own tail and looks impressed with themselves",
    "Pet does a little victory dance! Hip hip hooray! 🎊",
  ],
  random_sad: [
    "Pet whimpers softly",
    "Pet stares longingly at the food area 👀",
    "Pet looks sad and needs some love",
    "Pet sits in the corner looking forlorn 😢",
    "Pet lets out a lonely little meow/bark",
    "Pet droops a bit, wishing someone would play",
    "Pet huddles into a tiny ball, feeling down",
    "Pet gazes out the window looking melancholy 🪟",
  ],
  random_tired: [
    "Pet yawns widely",
    "Pet naps peacefully",
    "Zzz... Pet is snooozing",
    "Pet curls up into a cozy little ball for sleepies 😴",
    "Pet's eyes slowly droop closed... so tired...",
    "Pet does a big stretch and then collapses",
    "*Pet snores adorably* 💤",
    "Pet finds a sunny spot and drifts off to dreamland ☀️😴",
  ],
};

/**
 * Get a random message from a category
 */
export const getRandomMessage = (key: keyof typeof messages): string => {
  const category = messages[key];
  if (!category || category.length === 0) {
    return "Pet exists mysteriously.";
  }
  const randomIndex = Math.floor(Math.random() * category.length);
  return category[randomIndex];
};

/**
 * Format pet status with progress bars
 */
export const formatStatus = (
  petName: string,
  hunger: number,
  happiness: number,
  energy: number,
  mood: string
): string => {
  const clamp = (value: number): number => Math.max(0, Math.min(100, value));
  const h = clamp(hunger);
  const hap = clamp(happiness);
  const e = clamp(energy);

  const createBar = (value: number): string => {
    const filled = Math.round(value / 10);
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  };

  const hungerBar = createBar(h);
  const happinessBar = createBar(hap);
  const energyBar = createBar(e);

  const hungerPercent = h.toString().padStart(3, " ");
  const happinessPercent = hap.toString().padStart(3, " ");
  const energyPercent = e.toString().padStart(3, " ");

  const moodEmoji = {
    starving: "😭",
    sad: "😢",
    exhausted: "😴",
    playful: "🎉",
    content: "🌟",
  }[mood] || "❓";

  return (
    `**${petName}'s Status**\n` +
    `Hunger:    ${hungerBar} ${hungerPercent}%\n` +
    `Happiness: ${happinessBar} ${happinessPercent}%\n` +
    `Energy:    ${energyBar} ${energyPercent}%\n` +
    `Mood: **${mood}** ${moodEmoji}`
  );
};
