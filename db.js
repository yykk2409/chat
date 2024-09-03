// db.js
const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.PGUSER || 'your_user',
    host: process.env.PGHOST || 'your_host',
    database: process.env.PGDATABASE || 'your_database',
    password: process.env.PGPASSWORD || 'your_password',
    port: process.env.PGPORT || 5432,
});

module.exports = pool;
