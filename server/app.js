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
    try {
        const { nombre, correo, contrasena, telefono, profile_pic } = req.body;
        const pic = profile_pic || 'logo_mini.png'; // default avatar
        await connection.query("INSERT INTO users (name, email, password, phone_number, profile_pic) VALUES (?, ?, ?, ?, ?)", [nombre, correo, contrasena, telefono, pic]);
        res.status(201).json({ success: true, msg: 'User succesfully registered.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;
    const [rows] = await connection.query("SELECT * FROM users WHERE email = ? AND password = ?", [correo, contrasena]);
    if (rows.length !== 0) {
        const userData = {
            name: rows[0].name,
            email: rows[0].email,
            profile_pic: rows[0].profile_pic || 'logo_mini.png'
        };
        return res.status(200).json({ success: true, msg: 'User succesfully logged in.', user: userData });
    }
    res.status(400).json({ success: false, msg: 'User not logged in.' });
});

app.post('/api/products', async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria, imagen, user_email } = req.body;
        await connection.query(
            "INSERT INTO products (nombre, descripcion, precio, categoria, imagen, user_email) VALUES (?, ?, ?, ?, ?, ?)",
            [nombre, descripcion, precio, categoria, imagen, user_email]
        );
        res.status(201).json({ success: true, msg: 'Product successfully added.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Error adding product.' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await connection.query("SELECT * FROM products ORDER BY id DESC");
        res.status(200).json({ success: true, products: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Error fetching products.' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_email } = req.body;
        
        const [rows] = await connection.query("SELECT user_email FROM products WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, msg: 'Producto no encontrado.' });
        }
        
        // Allow deletion if the product has no owner (legacy) or if the owner matches
        if (rows[0].user_email && rows[0].user_email !== user_email) {
            return res.status(403).json({ success: false, msg: 'No tienes permiso para borrar este producto.' });
        }

        await connection.query("DELETE FROM products WHERE id = ?", [id]);
        res.status(200).json({ success: true, msg: 'Product deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Error deleting product.' });
    }
});

app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
})
