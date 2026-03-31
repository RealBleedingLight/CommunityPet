import { feedCommand } from './feed.js';
import { playCommand } from './play.js';
import { talkCommand } from './talk.js';
import { petCommand } from './pet.js';
import { statusCommand } from './status.js';
import { renameCommand } from './rename.js';

/**
 * All command handlers
 */
export const commands = [
  feedCommand,
  playCommand,
  talkCommand,
  petCommand,
  statusCommand,
  renameCommand,
];

/**
 * Command registry for quick lookup by name
 */
export const commandMap = new Map(commands.map((cmd) => [cmd.data.name, cmd]));

export { feedCommand, playCommand, talkCommand, petCommand, statusCommand, renameCommand };
