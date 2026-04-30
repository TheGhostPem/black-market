const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'lamamalona1',
        database: 'black_market'
    });

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(128) NOT NULL,
                product_id INT NOT NULL,
                product_nombre VARCHAR(100),
                product_precio DECIMAL(10,2),
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla orders creada correctamente');
    } catch (e) {
        console.error('Error:', e.message);
    }

    await connection.end();
}

main();
