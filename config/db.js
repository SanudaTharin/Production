const mysql = require("mysql2");

// Create a connection pool
const pool = mysql.createPool({
    host: "dbinstance.c9iew8g22qca.eu-north-1.rds.amazonaws.com",
    user: "admin",
    password: "Ananda2456",
    database: "Production",
    waitForConnections: true,
    connectionLimit: 10,       // Max number of connections in pool
    queueLimit: 0              // Unlimited queued requests
});

// Optional: test connection with a ping
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection error:", err);
    } else {
        console.log("Connected to MySQL (via pool)");
        connection.release(); // Release right after testing
    }
});

module.exports = pool;


