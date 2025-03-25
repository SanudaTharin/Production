const db = require("../config/db");
const moment = require("moment-timezone"); // Import moment-timezone

// Function to determine shift based on server's local time
const getShift = () => {
    let hour = moment().hour(); // Get hour in server's local time
    return (hour >= 8 && hour < 20) ? "Day" : "Night";
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
    main_query.Shift_Production,
    main_query.Performance,
    main_query.shift,
    main_query.Availability,
    latest_entry.time AS Last_Entry_Time,
    latest_entry.production AS Last_Production,
    latest_entry.cumulative_production AS Last_Cumulative_Production
FROM (
    SELECT 
        Shift_Production,
        CASE
            WHEN entry_rate != 0 THEN (Shift_Production * 1.25) / (entry_rate * 60) 
            ELSE 0
        END AS Performance, 
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
        ) / (10.5 * 3600) AS Availability
    FROM (
        SELECT 
            CASE 
                WHEN CONVERT_TZ(CURTIME(), 'UTC', 'Asia/Colombo') BETWEEN '20:00:00' AND '23:59:59' THEN 
                    (SELECT IFNULL(SUM(production), 0) 
                     FROM punching_machine 
                     WHERE time BETWEEN '20:00:00' AND CONVERT_TZ(CURTIME(), 'UTC', 'Asia/Colombo') 
                     AND date = CURDATE()) 
                WHEN CONVERT_TZ(CURTIME(), 'UTC', 'Asia/Colombo') BETWEEN '00:00:00' AND '07:59:59' THEN 
                    (SELECT IFNULL(SUM(production), 0) 
                     FROM punching_machine 
                     WHERE time BETWEEN '20:00:00' AND '23:59:59' 
                     AND date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) 
                ELSE 
                    (SELECT IFNULL(SUM(production), 0) 
                     FROM punching_machine 
                     WHERE TIME(time) BETWEEN '08:00:00' AND '19:59:59' 
                     AND date = CURDATE())
            END AS Shift_Production,
            
            SELECT 
    (SELECT COUNT(*)  
     FROM punching_machine
     WHERE production = 0
     AND (
         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '08:00:00' AND '19:59:59' 
          AND TIME(time) BETWEEN '08:00:00' 
          AND (SELECT MAX(time) FROM punching_machine WHERE date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))))
         
         OR 
         
         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '20:00:00' AND '23:59:59' 
          AND TIME(time) BETWEEN '20:00:00' 
          AND (SELECT MAX(time) FROM punching_machine WHERE date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))))
         
         OR
         
         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '00:00:00' AND '07:59:59' 
          AND TIME(time) BETWEEN '20:00:00' 
          AND (SELECT MAX(time) FROM punching_machine WHERE date = DATE_SUB(DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')), INTERVAL 1 DAY)))
     )
     AND (
         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '08:00:00' AND '19:59:59' 
          AND date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))) 
         
         OR
         
         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '20:00:00' AND '23:59:59' 
          AND date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))) 
         
         OR
         
         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '00:00:00' AND '07:59:59' 
          AND date = DATE_SUB(DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')), INTERVAL 1 DAY))
     )
    ) AS entry_rate;

            
            MAX(time) AS time
        FROM punching_machine 
        WHERE date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))
    ) AS subquery
) AS main_query

CROSS JOIN (
    SELECT time, production, cumulative_production 
    FROM punching_machine 
    ORDER BY id DESC 
    LIMIT 1
) AS latest_entry;




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
