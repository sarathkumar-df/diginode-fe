const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
    try {
        console.log(`Connecting to: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')}...`); // Hide password
        const client = await pool.connect();
        console.log('Successfully connected to database!');
        const res = await client.query('SELECT NOW()');
        console.log('Database time:', res.rows[0].now);
        client.release();
        await pool.end();
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

testConnection();
