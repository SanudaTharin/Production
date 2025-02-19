const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "production_tracking"
});

//connect to database

db.connect(err => {
    if (err) console.error("Database connection error:",err);
    else console.log("Connected to MySQL");
});

module.exports = db;

