const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config/config.json");
const sequelize = new Sequelize(
  db.database,
  db.username,
  db.password,
  {
    host: db.host,
    port: 3306,
    dialect: "mysql",
  }
);
const Joi = require("joi");

async function create(req, res) {
  return res.status(200).send({ message: 'POST /user' });
}

async function updateUser(req, res) {
  return res.status(200).send({ message: `POST /user` });
}

async function getAll(req, res) {
  return res.status(200).send({ message: 'GET /user' });
}

//============================================================

const register = async(req, res) => {
  const { username, password, email } = req.body;
  const schema = Joi.object({
    username: Joi.string().required().messages({
        "any.required": "Field tidak boleh kosong",
        "string.empty": "Field tidak boleh kosong"
    }),
    password: Joi.string().required().min(6).messages({
        "any.required": "Field tidak boleh kosong",
        "string.empty": "Field tidak boleh kosong",
        "string.min": "Password minimal 6 karakter"
    }),
    email: Joi.string().email().required().messages({
        "any.required": "Field tidak boleh kosong",
        "string.empty": "Field tidak boleh kosong",
        "string.email": "Format email salah"
    })
  });
}

module.exports = {
  create,
  getAll,
  updateUser
}