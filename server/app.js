require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Configuración de correo (ENVÍO REAL) ──────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

async function enviarRecibo({ toEmail, nombre, precio, productNombre, fecha }) {
    const orderId = Math.floor(Math.random() * 90000) + 10000;
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #111 0%, #333 100%); padding: 40px 20px; text-align: center; border-bottom: 5px solid #FFAEC9;">
            <h1 style="color: #FFAEC9; margin: 0; font-size: 28px; letter-spacing: 2px;">BLACK MARKET</h1>
            <p style="color: white; margin: 10px 0 0; font-size: 14px; opacity: 0.8; text-transform: uppercase;">Confirmación de Pedido #${orderId}</p>
        </div>
        
        <div style="padding: 40px; background-color: white;">
            <h2 style="color: #111; margin-top: 0; font-size: 22px;">¡Gracias por tu compra, ${nombre}!</h2>
            <p style="color: #666; line-height: 1.6;">Hemos recibido tu pedido y ya estamos procesándolo. Aquí tienes los detalles de tu transacción:</p>
            
            <div style="margin: 30px 0; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
                <table width="100%" style="border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th align="left" style="padding-bottom: 15px; border-bottom: 2px solid #f0f0f0; color: #111; font-size: 12px; text-transform: uppercase;">Producto</th>
                            <th align="right" style="padding-bottom: 15px; border-bottom: 2px solid #f0f0f0; color: #111; font-size: 12px; text-transform: uppercase;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 20px 0; color: #333; font-weight: bold;">${productNombre}</td>
                            <td align="right" style="padding: 20px 0; color: #111; font-weight: bold; font-size: 18px;">$${precio}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: right;">
                                <span style="color: #666; font-size: 14px;">Total Pagado:</span>
                                <span style="display: block; color: #FFAEC9; font-size: 24px; font-weight: bold; margin-top: 5px;">$${precio}</span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div style="background-color: #fff5f8; border-left: 4px solid #FFAEC9; padding: 15px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 13px; color: #884455;">
                    <strong>Fecha de compra:</strong> ${fecha}<br>
                    <strong>Método de pago:</strong> Tarjeta / Google Pay
                </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                <p>Estás recibiendo este correo porque realizaste una compra en Black Market Store.</p>
                <p>&copy; 2026 Black Market Team. Cartago, Valle, Colombia.</p>
            </div>
        </div>
    </div>`;

    await transporter.sendMail({
        from: `"Black Market Support" <blackmarketcorreo@gmail.com>`,
        to: toEmail,
        subject: `Factura de compra - Pedido #${orderId}`,
        html
    });
    console.log(`✉️ Recibo Premium enviado a: ${toEmail}`);
}

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'lamamalona1',
    database: 'black_market'
});

const PORT = 5000;
const app = express();
const path = require('path');

app.use(cors({ origin: '*' }));
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS, Imágenes) desde la carpeta de arriba
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, msg: 'Black market server is up and running...' });
});

// Redirigir la raíz a la página de la tienda
app.get('/', (req, res) => {
    res.redirect('/pagina.html');
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
            profile_pic: rows[0].profile_pic || 'logo_mini.png',
            phone: rows[0].phone_number
        };
        return res.status(200).json({ success: true, msg: 'User succesfully logged in.', user: userData });
    }
    res.status(400).json({ success: false, msg: 'User not logged in.' });
});

app.post('/api/google-login', async (req, res) => {
    try {
        const { token } = req.body;
        // 1. Verificar el token con Google
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        // 2. Buscar si el usuario ya existe en nuestra DB
        let [rows] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);

        let user;
        if (rows.length === 0) {
            // 3. Si no existe, lo creamos con la foto de Google
            const defaultPic = picture || 'logo_mini.png';
            await connection.query(
                "INSERT INTO users (name, email, password, profile_pic) VALUES (?, ?, ?, ?)",
                [name, email, 'GOOGLE_USER_' + Math.random(), defaultPic]
            );
            user = { name, email, profile_pic: defaultPic };
        } else {
            // 4. Si existe, usamos la que ya tiene o la de Google si la suya es la por defecto
            user = {
                name: rows[0].name,
                email: rows[0].email,
                profile_pic: rows[0].profile_pic || picture || 'logo_mini.png',
                phone: rows[0].phone_number
            };
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error Google Login:', error);
        res.status(401).json({ success: false, msg: 'Token de Google inválido' });
    }
});

app.put('/api/users/profile_pic', async (req, res) => {
    try {
        const { email, profile_pic } = req.body;
        if (!email) return res.status(400).json({ success: false, msg: 'Email is required' });

        await connection.query("UPDATE users SET profile_pic = ? WHERE email = ?", [profile_pic, email]);
        res.status(200).json({ success: true, msg: 'Profile picture updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Error updating profile picture.' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria, imagen, user_email } = req.body;

        // 🛡️ FILTRO DE SEGURIDAD: Moderación de contenido
        const palabrasProhibidas = [
            // Contenido Adulto / Inapropiado
            'dildo', 'sexo', 'porn', 'droga', 'arma', 'insulto', 'pene', 'vibrador',
            'condon', 'prepago', 'pistola', 'cuchillo', 'cocaína', 'marihuana',
            'alcohol', 'cerveza', 'cigarrillo', 'vape', 'casino', 'apuestas',
            'lenceria', 'erotico', 'juguete sexual', 'preservativo',
            // Ropa y Accesorios
            'ropa', 'camiseta', 'pantalon', 'zapato', 'vestido', 'tenis', 'camisa',
            'chaqueta', 'falda', 'medias', 'bolso', 'reloj', 'gafas',
            // Muebles
            'mueble', 'sofa', 'cama', 'silla', 'mesa', 'comedor', 'escritorio',
            'armario', 'closet', 'colchon', 'estante',
            // Vehículos
            'carro', 'auto', 'vehiculo', 'moto', 'camioneta', 'camion', 'bicicleta',
            'llanta', 'motor',
            // Servicios Humanos / No permitidos
            'novio', 'novia', 'alquiler de personas', 'acompañante', 'cita', 'evento', 'salidas', 'alquiler',
            // Ropa Interior
            'pantaloncillos', 'boxer', 'tanga', 'interiores', 'calzoncillos', 'brasier'
        ];
        const contenido = (nombre + " " + descripcion).toLowerCase();

        const tienePalabraProhibida = palabrasProhibidas.some(palabra => contenido.includes(palabra));

        if (tienePalabraProhibida) {
            return res.status(400).json({
                success: false,
                msg: '⚠️ Contenido inapropiado detectado. Black Market solo permite electrodomésticos y tecnología.'
            });
        }

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

app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, precio, user_email } = req.body;
        const ADMIN_EMAILS = ['blackmarketcorreo@gmail.com', 'juanjoherrera022@gmail.com'];

        // Verificar propiedad o si es ADMIN
        const [rows] = await connection.query("SELECT user_email FROM products WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, msg: 'Producto no encontrado.' });

        const isOwner = rows[0].user_email === user_email;
        const isAdmin = ADMIN_EMAILS.includes(user_email);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, msg: 'No tienes permiso para editar esto.' });
        }

        await connection.query("UPDATE products SET descripcion = ?, precio = ? WHERE id = ?", [descripcion, precio, id]);
        res.status(200).json({ success: true, msg: 'Producto actualizado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Error al editar producto.' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_email } = req.body;
        const ADMIN_EMAILS = ['blackmarketcorreo@gmail.com', 'juanjoherrera022@gmail.com'];

        const [rows] = await connection.query("SELECT user_email FROM products WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, msg: 'Producto no encontrado.' });

        const isOwner = rows[0].user_email === user_email;
        const isAdmin = ADMIN_EMAILS.includes(user_email);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, msg: 'No tienes permiso para borrar este producto.' });
        }

        await connection.query("DELETE FROM products WHERE id = ?", [id]);
        res.status(200).json({ success: true, msg: 'Product deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Error deleting product.' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { user_email, product_id, product_nombre, product_precio, phone } = req.body;
        if (!user_email) return res.status(401).json({ success: false, msg: 'Debes iniciar sesión para comprar.' });

        // Si el usuario proporcionó un teléfono en el pago y no lo tenía, lo actualizamos en la DB
        if (phone) {
            await connection.query("UPDATE users SET phone_number = ? WHERE email = ? AND (phone_number IS NULL OR phone_number = '')", [phone, user_email]);
        }

        // Guardar orden
        await connection.query(
            "INSERT INTO orders (user_email, product_id, product_nombre, product_precio) VALUES (?, ?, ?, ?)",
            [user_email, product_id, product_nombre, product_precio]
        );

        // Obtener datos del usuario (nombre y teléfono)
        const [users] = await connection.query("SELECT name, phone_number FROM users WHERE email = ?", [user_email]);
        const user = users[0] || {};
        const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

        // 1. Enviar recibo al COMPRADOR
        enviarRecibo({
            toEmail: user_email,
            nombre: user.name || 'Cliente',
            precio: product_precio,
            productNombre: product_nombre,
            fecha
        }).catch(e => console.error('Error al enviar recibo al comprador:', e.message));

        // 2. Notificar al VENDEDOR
        const [productOwner] = await connection.query("SELECT user_email FROM products WHERE id = ?", [product_id]);
        if (productOwner.length > 0 && productOwner[0].user_email) {
            notificarVendedor({
                vendedorEmail: productOwner[0].user_email,
                compradorNombre: user.name || 'Un cliente',
                compradorEmail: user_email,
                productNombre: product_nombre,
                precio: product_precio,
                fecha
            }).catch(e => console.error('Error al notificar al vendedor:', e.message));
        }

        res.status(201).json({
            success: true,
            msg: '¡Compra realizada con éxito!',
            phone: user.phone_number || null,
            userName: user.name || 'Cliente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Error al procesar la compra.' });
    }
});

// Función para avisar al dueño del producto
async function notificarVendedor({ vendedorEmail, compradorNombre, compradorEmail, productNombre, precio, fecha }) {
    const currentTransporter = await getTransporter();

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#111;color:white;border-radius:12px;overflow:hidden;border:2px solid #FFAEC9;">
        <div style="background:#FFAEC9;padding:24px;text-align:center;color:black;">
            <h1 style="margin:0;font-size:22px;">💰 ¡VENDISTE UN PRODUCTO!</h1>
        </div>
        <div style="padding:28px;">
            <p>¡Felicidades! Alguien ha comprado uno de tus artículos en <strong>Black Market</strong>.</p>
            <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 10px;color:#aaa;">Detalles de la venta:</p>
                <p><strong>Producto:</strong> ${productNombre}</p>
                <p><strong>Ganancia:</strong> <span style="color:#FFAEC9;font-weight:bold;">$${precio}</span></p>
                <p><strong>Fecha:</strong> ${fecha}</p>
            </div>
            <div style="border-top:1px solid #333;padding-top:15px;">
                <p style="margin:0;color:#aaa;font-size:13px;">Datos del comprador para la entrega:</p>
                <p style="margin:5px 0;"><strong>Nombre:</strong> ${compradorNombre}</p>
                <p style="margin:5px 0;"><strong>Email:</strong> ${compradorEmail}</p>
            </div>
        </div>
    </div>`;

    await currentTransporter.sendMail({
        from: `"Black Market Sales" <no-reply@blackmarket.com>`,
        to: vendedorEmail,
        subject: `💰 ¡Nueva Venta! — ${productNombre}`,
        html
    });
    console.log(`🔔 Notificación enviada al vendedor: ${vendedorEmail}`);
}

app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
})

