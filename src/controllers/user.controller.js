// const { Sequelize, DataTypes } = require("sequelize");
// const { db } = require("../config/config.json");
// const sequelize = new Sequelize(
//   db.database,
//   db.username,
//   db.password,
//   {
//     host: db.host,
//     port: 3306,
//     dialect: "mysql",
//   }
// );
// const Joi = require("joi");

async function create(req, res) {
  return res.status(200).send({ message: 'POST /user' });
}

async function updateUser(req, res) {
  return res.status(200).send({ message: `POST /user` });
}

async function getAll(req, res) {
  return res.status(200).send({ message: 'GET /user' });
}

module.exports = {
  create,
  getAll,
  updateUser
}