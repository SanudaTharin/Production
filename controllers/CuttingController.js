const db = require("../config/db");
const moment = require("moment-timezone"); // Import moment-timezone

// Function to determine shift based on server's local time
const getShift = () => {
    let hour = moment().hour(); // Get hour in server's local time
    return (hour >= 8 && hour < 22) ? "Day" : "Night";
};

// Insert production data with server's local date & time
const insertCuttingData = (req, res) => {
    const { production } = req.body;
    if (production === undefined || production === null) {
        return res.status(400).json({ error: "Production value required" });
    }

    const shift = getShift();
    const productionValue = Math.ceil(Number(production) / 2); // Ensure it's a number
    const Date = moment().format("YYYY-MM-DD"); // Server's local Date
    const Time = moment().format("HH:mm:ss"); // Server's local Time

    
    // Get the latest cumulative production from the database
    db.query("SELECT cumulative_production FROM cutter_machine ORDER BY id DESC LIMIT 1", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        let cumulativeProduction = productionValue; // Default to current production if no previous data exists
        if (results.length > 0) {
            cumulativeProduction = Number(results[0].cumulative_production) + productionValue; // Ensure numerical addition
        }

        // Insert data into database with server's local date & time
        const sql = `INSERT INTO cutter_machine (date, time, shift, production, cumulative_production) VALUES (?, ?, ?, ?, ?)`;
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
const getCuttingData = (req, res) => {
    // Query the database to get all the production data
    db.query("SELECT * FROM cutter_machine ORDER BY id DESC", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        // Send back the results as a JSON response
        res.status(200).json(results);
    });
};

const getcuttingShift = (req, res) => {
    // Query the database to get the production difference and shift data
    db.query(`
        SELECT
            main_query.Shift_Production,
            main_query.Performance,
            main_query.shift,
            main_query.Availability,
            main_query.units_per_min,
            latest_entry.time AS Last_Entry_Time,
            latest_entry.production AS Last_Production,
            latest_entry.cumulative_production AS Last_Cumulative_Production
        FROM (
            SELECT
                Shift_Production,
                CASE
                    WHEN entry_rate != 0 THEN (Shift_Production * 7.5 * 100) / (entry_rate * 60)
                    ELSE 0
                END AS Performance,
                CASE
                    WHEN TIME(MAX(time)) BETWEEN '08:00:00' AND '19:59:59' THEN 'Day'
                    ELSE 'Night'
                END AS shift,
                (entry_rate * 100 / (shift_time)) AS Availability,
                CASE
                    WHEN shift_time != 0 THEN FLOOR(Shift_Production / shift_time)
                    ELSE 0
                END AS units_per_min
            FROM (
                SELECT 
                    CASE 
                        WHEN TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '00:00:00' AND '07:59:59'
                        THEN (
                            (SELECT IFNULL(SUM(production), 0) FROM cutter_machine 
                             WHERE time BETWEEN '20:00:00' AND '23:59:59' 
                             AND date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) 
                            +
                            (SELECT IFNULL(SUM(production), 0) FROM cutter_machine 
                             WHERE time BETWEEN '00:00:00' AND '07:59:59' 
                             AND date = CURDATE())
                        )
                        WHEN TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '08:00:00' AND '19:59:59'
                        THEN (
                            SELECT IFNULL(SUM(production), 0) FROM cutter_machine 
                            WHERE time BETWEEN '08:00:00' AND '19:59:59' 
                            AND date = CURDATE()
                        )
                        WHEN TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '20:00:00' AND '23:59:59'
                        THEN (
                            SELECT IFNULL(SUM(production), 0) FROM cutter_machine 
                            WHERE time BETWEEN '20:00:00' AND '23:59:59' 
                            AND date = CURDATE()
                        )
                        ELSE 0
                    END AS Shift_Production,

                    
                   (SELECT COUNT(*)
                        FROM cutter_machine 
                        WHERE production != 0
                        AND (
                            (
                            TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '08:00:00' AND '19:59:59'
                            AND date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))
                            AND TIME(time) BETWEEN '08:00:00'
                            AND (SELECT MAX(time) FROM cutter_machine WHERE date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))) 
                            )
                            OR
                            (
                            TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '20:00:00' AND '23:59:59'
                            AND date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))
                            AND TIME(time) BETWEEN '20:00:00'
                            AND (SELECT MAX(time) FROM cutter_machine WHERE date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))) 
                            )
                            OR
                            (
                            TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '00:00:00' AND '07:59:59'
                            AND CONCAT(date, ' ', time) >= DATE_FORMAT(
                                DATE_SUB(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'), INTERVAL 1 DAY), '%Y-%m-%d 20:00:00')
                            AND CONCAT(date, ' ', time) <= DATE_FORMAT(
                                CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'), '%Y-%m-%d %H:%i:%s')
                            )
                          )
                        ) AS entry_rate,

                    (SELECT COUNT(*)
                     FROM cutter_machine
                     WHERE (
                         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '08:00:00' AND '19:59:59'
                          AND TIME(time) BETWEEN '08:00:00'
                          AND (SELECT MAX(time) FROM cutter_machine WHERE date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')))
                          AND NOT (TIME(time) BETWEEN '12:30:00' AND '12:59:59'))
                         OR
                         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '20:00:00' AND '23:59:59'
                          AND TIME(time) BETWEEN '20:00:00'
                          AND (SELECT MAX(time) FROM cutter_machine WHERE date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo'))))
                         OR
                         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '00:00:00' AND '07:59:59'
                          AND TIME(time) BETWEEN '20:00:00'
                          AND (SELECT MAX(time) FROM cutter_machine WHERE date = DATE_SUB(DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')), INTERVAL 1 DAY)))
                     )
                     AND (
                         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '08:00:00' AND '19:59:59' AND date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')))
                         OR
                         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '20:00:00' AND '23:59:59' AND date = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')))
                         OR
                         (TIME(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')) BETWEEN '00:00:00' AND '07:59:59' AND date = DATE_SUB(DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Colombo')), INTERVAL 1 DAY))
                     )
                    ) AS shift_time,

                    MAX(time) AS time
                FROM cutter_machine
                WHERE date = CURDATE()
            ) AS subquery
        ) AS main_query
        CROSS JOIN (
            SELECT time, production, cumulative_production
            FROM cutter_machine
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

// API Route to Get Cumulative Production
const cutpermonth = (req, res) => { 
    const { year, month } = req.query;
  
    if (!year || !month) {
        return res.status(400).json({ error: "Year and month are required" });
    }
  
    const query = `
        SELECT date, SUM(production) AS production
        FROM cutter_machine
        WHERE YEAR(date) = ? AND MONTH(date) = ?
        GROUP BY date
        ORDER BY date;
    `;

    db.query(query, [parseInt(year), parseInt(month)], (err, results) => {
        if (err) {
            console.error("Query error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(results);  
    });
};


module.exports = { insertCuttingData, getCuttingData, getcuttingShift, cutpermonth };
