const db = require("../config/db");
const moment = require("moment-timezone"); // Import moment-timezone

// Function to determine shift based on server's local time
const getShift = () => {
    let hour = moment().hour(); // Get hour in server's local time
    return (hour >= 8 && hour < 22) ? "Day" : "Night";
};

// Insert production data with server's local date & time
const insertPunchingData = (req, res) => {
    const { production } = req.body;
    if (production === undefined || production === null) {
        return res.status(400).json({ error: "Production value required" });
    }

    const shift = getShift();
    const productionValue = Number(production); // Ensure it's a number
    const Date = moment().format("YYYY-MM-DD"); // Server's local Date
    const Time = moment().format("HH:mm:ss"); // Server's local Time

    
    // Get the latest cumulative production from the database
    db.query("SELECT cumulative_production FROM punching_machine ORDER BY id DESC LIMIT 1", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        let cumulativeProduction = productionValue; // Default to current production if no previous data exists
        if (results.length > 0) {
            cumulativeProduction = Number(results[0].cumulative_production) + productionValue; // Ensure numerical addition
        }

        // Insert data into database with server's local date & time
        const sql = `INSERT INTO punching_machine (date, time, shift, production, cumulative_production) VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [Date, Time, shift, productionValue, cumulativeProduction], (err) => {
            if (err) {
                console.error("Insert error:", err);
                return res.status(500).json({ error: "Error inserting data" });
            }
            res.status(200).json({ message: "Data inserted successfully" });
        });
    });
};

// Retrieve production data
const getPunchingData = (req, res) => {
    // Query the database to get all the production data
    db.query("SELECT * FROM punching_machine ORDER BY id DESC", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        // Send back the results as a JSON response
        res.status(200).json(results);
    });
};

module.exports = { insertPunchingData, getPunchingData };
