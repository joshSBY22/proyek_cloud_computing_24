const db = require("../database/firestore");
const Joi = require("joi");
const { hashPassword } = require("../helper/passwordHash");
const isUserAlreadyRegistered = require("../helper/isUserAlreadyRegistered");

async function create(req, res) {

  const schema = Joi.object({
    username: Joi.string().required().external( async (value, helpers) => {  
        const userAlreadyExists = await isUserAlreadyRegistered(value);
        
        if (userAlreadyExists) {
          // Return error if username already exists
          throw new Joi.ValidationError('Custom error message', [{ message: 'Username already exist' }], value);
        }
        
        return value; // Valid if username does not exist
      }
    ).messages({
      "string.empty": "Username is required",
      "any.required": "Username is required",
    }),
    name: Joi.string().required().messages({
      "string.empty": "Nama is required",
      "any.required": "Nama is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Email is not valid",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be contain at least 6 characters",
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
    confirm_password: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Password not match",
        "any.required": "Confirm Password is required",
      }),
  });

  try {    
    const value = await schema.validateAsync(req.body, { abortEarly: false });

    const usersDb = db.collection('users'); 

    const newUser = usersDb.doc(value.username); //add new document with id that passed in argument

    // create new document with given user data
    await newUser.set({ // set method also can override existing document if it is already exist
      name: value.name,
      email: value.email,
      password: await hashPassword(value.password),  // hash password before save to database
    });

    return res.status(200).send({ 
      message: "Registration Success",
      data: {
        username: req.body.username,
        name: req.body.name,
        email: req.body.email,
      }
    });
  } catch (error) {
    // console.log(error.details);

    if (error.isJoi) {
      // Joi validation error
      return res.status(400).send({
        message: error.details.map((detail) => detail.message).join(", ") || "Validation error",
      });
    }

    // Unexpected errors
    return res.status(500).send({ message: error.message });
  }
}

async function updateUser(req, res) {
  return res.status(200).send({ message: `POST /user` });
}

async function getAll(req, res) {
  return res.status(200).send({ message: "GET /user" });
}

module.exports = {
  create,
  getAll,
  updateUser,
};
