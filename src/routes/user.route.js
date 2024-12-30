const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/user.controller');

userRouter.get('/all', userController.getAll);

userRouter.post('/register', userController.create);

userRouter.post('/login', userController.login);

userRouter.put('/edit', userController.updateUser);


module.exports = userRouter;