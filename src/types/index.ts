// Server metadata
export interface Server {
  id: string;
  serverId: string; // Discord server ID
  petName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pet stats and state
export interface PetState {
  id: string;
  serverId: string;
  hunger: number; // 0-100
  happiness: number; // 0-100
  energy: number; // 0-100
  mood: 'starving' | 'sad' | 'exhausted' | 'playful' | 'content';
  lastInteractionAt: Date;
  lastFedAt?: Date;
  lastPlayedAt?: Date;
  lastTalkedAt?: Date;
  lastPettedAt?: Date;
  updatedAt: Date;
}

// Interaction types
export type InteractionType = 'feed' | 'play' | 'talk' | 'pet';

// Interaction log
export interface InteractionLog {
  id: string;
  serverId: string;
  userId: string;
  action: InteractionType;
  timestamp: Date;
}

// Command context
export interface CommandContext {
  serverId: string;
  userId: string;
  userName: string;
  isMod: boolean;
}

// Pet response to commands
export interface PetResponse {
  text: string;
  mood: string;
  statChanges: {
    hunger?: number;
    happiness?: number;
    energy?: number;
  };
}
