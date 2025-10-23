import mysql from "mysql2/promise";

const configAdmin = {
  host: "localhost",
  user: "kioscouser",
  port: 3306,
  password: "kioscouser1",
  database: "kioscodb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const connectionAdmin = mysql.createPool(configAdmin);

const configUser = {
  host: "localhost",
  user: "kioscoUsers",
  port: 3306,
  password: "kioscoUsers1605.",
  database: "kioscodb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const connectionUser = mysql.createPool(configUser);
