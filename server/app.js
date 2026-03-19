const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'lamamalona1',
    database: 'black_market'
});

const PORT = 5000;
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, msg: 'Black market server is up and running...' });
});

app.post('/api/register', async (req, res) => {
    const { nombre, correo, contrasena, telefono } = req.body;
    await connection.query("INSERT INTO users (name, email, password, phone_number) VALUES (?, ?, ?, ?)", [nombre, correo, contrasena, telefono]);
    res.status(201).json({ success: true, msg: 'User succesfully registered.' });
});

app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;
    const [rows] = await connection.query("SELECT * FROM users WHERE email = ? AND password = ?", [correo, contrasena]);
    if (rows.length !== 0) return res.status(200).json({ success: true, msg: 'User succesfully logged in.' });
    res.status(400).json ({ success: false, msg: 'User not logged in.' });
});

app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
})