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

const getpunchingShift = (req, res) => {
    // Query the database to get the production difference and shift data
    db.query(`
        SELECT 
    CASE 
        WHEN CURTIME() BETWEEN '20:00:00' AND '23:59:59' THEN 
            (SELECT IFNULL(SUM(production), 0) FROM punching_machine WHERE time BETWEEN '20:00:00' AND CURTIME() AND date = CURDATE()) 
            - (SELECT IFNULL(SUM(production), 0) FROM punching_machine WHERE time = '20:00:00' AND date = CURDATE())
        WHEN CURTIME() BETWEEN '00:00:00' AND '07:59:59' THEN 
            (SELECT IFNULL(SUM(production), 0) FROM punching_machine WHERE time BETWEEN '20:00:00' AND '23:59:59' AND date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) 
            - (SELECT IFNULL(SUM(production), 0) FROM punching_machine WHERE time = CURTIME() AND date = CURDATE())
        ELSE 
            (SELECT IFNULL(SUM(production), 0) FROM punching_machine WHERE TIME(time) BETWEEN '08:00:00' AND '19:59:59' AND date = CURDATE()) 
            - (SELECT IFNULL(SUM(production), 0) FROM punching_machine WHERE time = (SELECT MAX(time) FROM punching_machine WHERE date = CURDATE()))
    END AS Shift_Production,
    CASE 
        WHEN TIME(MAX(time)) BETWEEN '08:00:00' AND '19:59:59' THEN 'Day' 
        ELSE 'Night' 
    END AS shift,
    ABS(
        TIME_TO_SEC(MAX(time)) - TIME_TO_SEC(
            CASE 
                WHEN TIME(MAX(time)) BETWEEN '08:00:00' AND '19:59:59' THEN '08:00:00' 
                ELSE '23:00:00' 
            END
        )
    ) / (10.5 * 3600) AS time_division 
     FROM punching_machine 
     WHERE date = CURDATE();


    `, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        // Send back the results as a JSON response
        res.status(200).json(results);
    });
};



module.exports = { insertPunchingData, getPunchingData, getpunchingShift };
