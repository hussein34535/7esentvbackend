import postgres from 'postgres';

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env;
    if (DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST) {
        connectionString = `postgres://${DATABASE_USERNAME}:${encodeURIComponent(DATABASE_PASSWORD || '')}@${DATABASE_HOST}:${DATABASE_PORT || 5432}/${DATABASE_NAME || 'postgres'}?sslmode=require`;
    }
}

if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}

// Use global singleton to prevent exhausting connections in dev
const globalForDb = global as unknown as { sql: ReturnType<typeof postgres> };

const sql = globalForDb.sql || postgres(connectionString, {
    ssl: 'require',
    max: 10, // Limit pool size
    idle_timeout: 20,
    connect_timeout: 10,
});

if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql;

export default sql;
