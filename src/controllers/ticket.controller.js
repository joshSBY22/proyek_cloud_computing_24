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
const Joi = require("joi");

//=================================================================

async function create(req, res) {
  const {ticketTitle, ticketPrice, ticketDescription} = req.body;
  const schema = Joi.object({
    ticketTitle: Joi.string().required().messages({
      'string.empty': '"Nama tiket wajib diisi"',
      'any.required': '"Nama tiket wajib diisi"'
    }),
    ticketPrice: Joi.number().min(0).max(100000000).required().messages({
      'number.base': '"Harga tiket wajib diisi menggunakan angka"',
      'number.min': '"Minimal harga tiket 0"',
      'number.max': '"Maximal harga tiket 100000000"',
      'number.empty': `"Harga tiket wajib diisi"`,
      'any.required': '"Harga tiket wajib diisi"'
    }),
    ticketDescription: Joi.string().required().messages({
      'string.empty': '"Deksripsi wajib diisi"',
      'any.required': '"Deksripsi wajib diisi"'
    })
  });
  //Schema Validation
  try{
    await schema.validateAsync(req.body);
  }
  catch(error){
    return res.status(403).send(error.toString());
  }

  // return res.status(200).send({ message: 'POST /ticket' });
}

async function getAll(req, res) {
  return res.status(200).send({ message: 'GET /ticket' });
}

async function getById(req, res) {
  return res.status(200).send({ message: 'GET /ticket with id ' + req.params.id });
}

async function update(req, res) {
  return res.status(200).send({ message: 'PUT /ticket' });
}

async function remove(req, res) {
  return res.status(200).send({ message: 'DELETE /ticket' });
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove
}