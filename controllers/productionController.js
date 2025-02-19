const db = require("../config/db");

// Function to determine shift based on time
const getShift = () => {
    let hour = new Date().getHours();
    if (hour >= 8 && hour < 22) return "Day"; 
    else if (hour >= 22 && hour < 8) return "Night";
    
};

// Insert production data
const insertProductionData = (req, res) => {
    const { production } = req.body;
    if (production === undefined || production === null) {
        return res.status(400).json({ error: "Production value required" });
      }
      

    const shift = getShift();

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

        // Insert data into database
        const sql = `INSERT INTO production_data (shift, production, cumulative_production) VALUES (?, ?, ?)`;
        db.query(sql, [shift, production, cumulativeProduction], (err) => {
            if (err) {
                console.error("Insert error:", err);
                return res.status(500).json({ error: "Error inserting data" });
            }
            res.status(200).json({ message: "Data inserted successfully" });
        });
    });
};

module.exports = { insertProductionData };
