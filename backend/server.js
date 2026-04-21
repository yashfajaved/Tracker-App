const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'leohub_db'
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Leo Hub MySQL Connected... Success! ✨");
});

app.post('/add-data', (req, res) => {
    const { name, email, password } = req.body;
    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, password], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Zalene Account Created! 🦁" });
    });
});

// 2. New Task (Product Listing) - Task 1 for Assignment
app.get('/products', (req, res) => {
    const sql = "SELECT * FROM products";
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results); // Saaray products JSON mein bhej dega
    });
});

// --- ROUTES END ---

app.listen(3000, () => {
    console.log("Server running on port 3000");
});