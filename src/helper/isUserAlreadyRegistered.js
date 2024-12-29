const db = require("../database/firestore");

const isUserAlreadyRegistered = async (username) => {  
  const user = await db.collection('users').doc(username).get();

  return user.exists;
};

module.exports = isUserAlreadyRegistered;
