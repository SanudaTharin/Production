const db = require("../config/db");
const moment = require("moment-timezone"); // Import moment-timezone

// Function to determine shift based on Sri Lanka time
const getShift = () => {
    let hour = moment().tz("Asia/Colombo").hour(); // Get hour in Sri Lanka time
    return (hour >= 8 && hour < 22) ? "Day" : "Night";
};

// Insert production data with Sri Lanka date & time
const insertProductionData = (req, res) => {
    const { production } = req.body;
    if (production === undefined || production === null) {
        return res.status(400).json({ error: "Production value required" });
    }

    const shift = getShift();
    const productionValue = Number(production); // Ensure it's a number
    const Date = moment().tz("Asia/Colombo").format("YYYY-MM-DD"); // Sri Lanka Date
    const Time = moment().tz("Asia/Colombo").format("HH:mm:ss"); // Sri Lanka Time

    // Get the latest cumulative production from the database
    db.query("SELECT cumulative_production FROM production_data ORDER BY id DESC LIMIT 1", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        let cumulativeProduction = productionValue; // Default to current production if no previous data exists
        if (results.length > 0) {
            cumulativeProduction = Number(results[0].cumulative_production) + productionValue; // Ensure numerical addition
        }

        // Insert data into database with Sri Lanka date & time
        const sql = `INSERT INTO production_data (date, time, shift, production, cumulative_production) VALUES (?, ?, ?, ?, ?)`;
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
const getProductionData = (req, res) => {
    // Query the database to get all the production data
    db.query("SELECT * FROM production_data ORDER BY id DESC", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        // Send back the results as a JSON response
        res.status(200).json(results);
    });
};

module.exports = { insertProductionData, getProductionData };
