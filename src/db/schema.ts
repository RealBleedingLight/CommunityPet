import { execute } from './client';

export const initializeSchema = async () => {
  try {
    // Create servers table
    await execute(`
      CREATE TABLE IF NOT EXISTS servers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        server_id BIGINT UNIQUE NOT NULL,
        pet_name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create pet_states table
    await execute(`
      CREATE TABLE IF NOT EXISTS pet_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        server_id BIGINT UNIQUE NOT NULL,
        hunger INT DEFAULT 50,
        happiness INT DEFAULT 50,
        energy INT DEFAULT 50,
        mood VARCHAR(50) DEFAULT 'neutral',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE
      )
    `);

    // Create interaction_logs table
    await execute(`
      CREATE TABLE IF NOT EXISTS interaction_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        server_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        action VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await execute(`
      CREATE INDEX IF NOT EXISTS idx_servers_server_id ON servers(server_id)
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_pet_states_server_id ON pet_states(server_id)
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_interaction_logs_server_id ON interaction_logs(server_id)
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_interaction_logs_user_id ON interaction_logs(user_id)
    `);

    console.log('✓ Database schema initialized');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
};
