const mysql = require('mysql2/promise');

const pool = mysql.createPool(process.env.DATABASE_URL
//     {
//     host: 'localhost',
//     user: 'root',
//     password: '',        // phpStudy 默认密码为空，如果是 root 则填 'root'
//     database: 'todo_app',
//     port: 3306,
//     waitForConnections: true,
//     connectionLimit: 10
// }
);

module.exports = pool;