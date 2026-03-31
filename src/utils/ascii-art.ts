/**
 * Get ASCII art representation for a given mood
 */
export const getAsciiArt = (mood: string): string => {
  const asciiArtMap: Record<string, string> = {
    starving: `
  (\\_/)
  (o.o)
   > ^ <
  /|   |\\
   |   |
  _|   |_
    🍽️
    HUNGRY!
    `,
    sad: `
  (\\_/)
  (T.T)
   > ^ <
  /|   |\\
   |   |
  _|   |_
   sad...
    `,
    exhausted: `
  (\\_/)
  (-_-)
   > ^ <
  /|   |\\
   |   |
  _|   |_
   zzz...
    `,
    playful: `
  (\\_/)
  (^.^)
   > ^ <
  /|   |\\
   |   |
  _|   |_
   WHEEE!
  `,
    content: `
  (\\_/)
  (=.=)
   > ^ <
  /|   |\\
   |   |
  _|   |_
    :)
    `,
  };

  return asciiArtMap[mood] || asciiArtMap.content;
};
