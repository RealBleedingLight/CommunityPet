import {
  verifyKey,
  InteractionType,
  InteractionResponseType,
} from 'discord-interactions';

interface DiscordInteraction {
  type: number;
  id: string;
  token: string;
}

/**
 * Discord Webhook Endpoint for Vercel
 *
 * This endpoint:
 * 1. Verifies Discord signatures (ED25519)
 * 2. Responds to PING heartbeats with PONG
 * 3. Defers command interactions (actual handling is done by the bot)
 */
export default async (req: Request): Promise<Response> => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  // Validate required headers and env var
  if (!signature || !timestamp || !publicKey) {
    return new Response(
      JSON.stringify({ error: 'Missing required headers or environment variable' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get raw body as string for signature verification
  const body = await req.text();

  // Verify Discord signature
  const isValid = await verifyKey(body, signature, timestamp, publicKey);

  if (!isValid) {
    console.warn('Invalid Discord signature');
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let interaction: DiscordInteraction;
  try {
    interaction = JSON.parse(body);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Handle PING interaction (Discord heartbeat)
  if (interaction.type === InteractionType.PING) {
    return new Response(
      JSON.stringify({
        type: InteractionResponseType.PONG,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Handle APPLICATION_COMMAND interactions
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    // Defer the response - the actual bot will handle the command and send follow-up
    return new Response(
      JSON.stringify({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Handle MESSAGE_COMPONENT interactions (buttons, select menus)
  if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
    // Defer the response - the actual bot will handle the interaction and send follow-up
    return new Response(
      JSON.stringify({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Handle MODAL_SUBMIT interactions
  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    // Defer the response - the actual bot will handle the submission and send follow-up
    return new Response(
      JSON.stringify({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Unknown interaction type
  console.warn(`Unknown interaction type: ${interaction.type}`);
  return new Response(
    JSON.stringify({ error: 'Unknown interaction type' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
};
