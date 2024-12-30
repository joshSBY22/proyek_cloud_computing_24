const jwt = require("jsonwebtoken");

const generateToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
}

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET_KEY);
}

module.exports = {
  generateToken,
  verifyToken
}