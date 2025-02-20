const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "dbinstance.c9iew8g22qca.eu-north-1.rds.amazonaws.com",
    user: "admin",
    password: "Ananda2456",
    database: "Production"
});

//connect to database

db.connect(err => {
    if (err) console.error("Database connection error:",err);
    else console.log("Connected to MySQL");
});

module.exports = db;

