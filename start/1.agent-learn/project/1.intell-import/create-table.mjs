import mysql from "mysql2/promise";

const connectionCfg = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "admin",
  multipleStatements: true,
};

async function main() {
  const connection = await mysql.createConnection(connectionCfg);

  // 创建 database
  await connection.query(`CREATE DATABASE IF NOT EXISTS hello CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.query(`USE hello;`);

  // 创建好友表
  await connection.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        gender VARCHAR(10),                -- 性别
        birth_date DATE,                   -- 出生日期
        company VARCHAR(100),              -- 公司
        title VARCHAR(100),                -- 职位
        phone VARCHAR(20),                 -- 当前手机号
        wechat VARCHAR(50)                 -- 微信号
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

  // 插入数据
  const insertSql = `
    INSERT INTO friends (
      name,
      gender,
      birth_date,
      company,
      title,
      phone,
      wechat
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    "Mino", // name
    "男", // gender
    "1997-01-01", // birth_date
    "Tincher", // company
    "产品经理/产品总监", // title
    "15035250351", // phone
    "yxd993240817", // wechat
  ];

  const [result] = await connection.execute(insertSql, values);
  console.log("成功创建数据库和表，并插入 demo 数据，插入ID：", result.insertId);
}

await main();
