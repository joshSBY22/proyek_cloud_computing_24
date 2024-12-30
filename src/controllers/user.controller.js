const db = require("../database/firestore");
const Joi = require("joi");
const { hashPassword, verifyPassword } = require("../helper/passwordHash");
const { generateToken, verifyToken } = require("../helper/jwtToken");
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
      "string.empty": "Name is required",
      "any.required": "Name is required",
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

    return res.status(201).send({ 
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

async function login(req, res) {
  const schema = Joi.object({
    username: Joi.string().required()
    .external( async (value, helpers) => {
      const userAlreadyExists = await isUserAlreadyRegistered(value);
      
      if (!userAlreadyExists) {
        // Return error if username does not exist
        throw new Joi.ValidationError('Custom error message', [{ message: 'Username not found' }], value);
      }
      
      return value; // Valid if username exists
    })
    .messages({
      "string.empty": "Username is required",
      "any.required": "Username is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
  });

  try {
    const value = await schema.validateAsync(req.body, { abortEarly: false });

    //verify password
    const user = await db.collection('users').doc(value.username).get();
    if(await verifyPassword(value.password, user.data().password)){
      const data = {
        username: user.id,
        email: user.data().email,
      }

      //return user JWT access token
      const token = generateToken(data);

      return res.status(200).send({ 
        message: "Login Success!",
        data: {
          username: user.data().username,
          name: user.data().name,
          email: user.data().email,
          access_token: token
        }
      });
    }else{
      return res.status(400).send({ message: "Password is incorrect" });
    }
    
  } catch (error) {
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
  const schema = Joi.object({ 
    name: Joi.string().messages({
      "string.empty": "Name can't be empty",
    }),
    email: Joi.string().email().messages({
      "string.email": "Email is not valid",
      "string.empty": "Email is required",
    }),
    new_password: Joi.string().min(6).messages({
      "string.min": "New Password must be contain at least 6 characters",
      "string.empty": "New Password is required",
    }),
    confirm_password: Joi.string()
      .valid(Joi.ref("new_password"))
      .when("new_password", {
        is: Joi.exist(),
        then: Joi.required(),
      })
      .messages({
        "string.empty": "Confirm Password is required",
        "any.only": "Confirm Password not match",
        "any.required": "Confirm Password is required",
      }),
  });

  let userUsername = null;

  try {
    if(!req.headers.authorization){
      return res.status(400).send({ message: "Token is required" });
    }

    //Authorization header format example:
    //authorization: Bearer <access_token>
    const token = req.headers.authorization.split(" ")[1]; //extract token from header
    
    const verified = verifyToken(token);
    
    if(verified){
      userUsername = verified.username;
    }else{
      return res.status(401).send({ message: "Unauthorized" });
    }

  } catch (error) {
    return res.status(401).send({ message: error.message });
  }

  try {
    const value = await schema.validateAsync(req.body, { abortEarly: false });

    if(userUsername){
      const userOldValue = (await db.collection('users').doc(userUsername).get()).data();

      const userDoc = db.collection('users').doc(userUsername);
      await userDoc.update({
        name: value.name ?? userOldValue.name,
        email: value.email ?? userOldValue.email,
        password: value.new_password ? await hashPassword(value.new_password) : userOldValue.password,
      });
      
      const updatedValue = (await db.collection("users").doc(userUsername).get()).data();
      //update user data
      return res.status(200).send({ 
        message: `User updated successfully!`,
        data: {
          username: userDoc.id,
          name: value.name ?? updatedValue.name,
          email: value.email ?? updatedValue.email,
          password: updatedValue.password,
        }
      });

    }else{
      return res.status(401).send({ message: "Unauthorized" });
    }

  } catch (error) {
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

async function getAll(req, res) {
  try {
    const usersSnapshot = await db.collection('users').get();

    // Check if the users collection is empty
    if (usersSnapshot.empty) {
      return res.status(404).send({ message: "No users found" });
    }

    // Map over the documents to extract data
    const users = usersSnapshot.docs.map(doc => ({
      username: doc.id, // Include document ID if needed
      ...doc.data()
    }));

    // Send the users data as a response
    return res.status(200).send({ data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).send({ message: "Internal Server Error", error: error.message });
  }
}


module.exports = {
  create,
  login,
  getAll,
  updateUser,
};
