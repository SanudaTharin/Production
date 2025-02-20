const db = require("../config/db");


const getShift = () => {
    let hour = new Date().getHours();
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
    const productionValue = Number(production); // Ensure it's a number

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

        // Insert data into database
        const sql = `INSERT INTO production_data (shift, production, cumulative_production) VALUES (?, ?, ?)`;
        db.query(sql, [shift, productionValue, cumulativeProduction], (err) => {
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