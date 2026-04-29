const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'lamamalona1',
        database: 'black_market'
    });

    try {
        await connection.query("ALTER TABLE products ADD COLUMN user_email VARCHAR(255)");
        console.log("Added user_email column to products");
    } catch (e) {
        console.log("Error or column already exists: ", e.message);
    }
    
    const [rows] = await connection.query("DESCRIBE products");
    console.log("Products schema:", rows);

    const [users] = await connection.query("DESCRIBE users");
    console.log("Users schema:", users);

    await connection.end();
}

main();
