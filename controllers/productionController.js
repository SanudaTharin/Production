const moment = require("moment-timezone");
const db = require("../config/db");

// Function to determine shift based on Sri Lanka time
const getShift = () => {
    let hour = moment().tz("Asia/Colombo").hour();
    if (hour >= 8 && hour < 22) return "Day";
    else return "Night";
};

// Insert production data
const insertProductionData = (req, res) => {
    const { production } = req.body;
    if (production === undefined || production === null) {
        return res.status(400).json({ error: "Production value required" });
    }

    const shift = getShift();
    const timestamp = moment().tz("Asia/Colombo").format("YYYY-MM-DD HH:mm:ss");

    // Get the latest cumulative production
    db.query("SELECT cumulative_production FROM production_data ORDER BY id DESC LIMIT 1", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        let cumulativeProduction = production; // Default to current production if no previous data exists
        if (results.length > 0) {
            cumulativeProduction += results[0].cumulative_production;
        }

        // Insert data into the database with correct timestamp
        const sql = `INSERT INTO production_data (shift, production, cumulative_production, timestamp) VALUES (?, ?, ?, ?)`;
        db.query(sql, [shift, production, cumulativeProduction, timestamp], (err) => {
            if (err) {
                console.error("Insert error:", err);
                return res.status(500).json({ error: "Error inserting data" });
            }
            res.status(200).json({ message: "Data inserted successfully" });
        });
    });
};

module.exports = { insertProductionData };
