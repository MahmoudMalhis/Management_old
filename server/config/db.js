require("dotenv").config();
const { Sequelize, DataTypes, Op } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: "mysql",
    logging: false,
  }
);

const connectDB = async () => {
  await sequelize.authenticate();
  console.log("MySQL Connected");
};

module.exports = { sequelize, DataTypes, Op, connectDB };
