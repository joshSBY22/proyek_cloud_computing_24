const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/user.controller');

userRouter.get('/', userController.getAll);

userRouter.post('/:id', userController.updateUser);

userRouter.post('/', userController.create);

module.exports = userRouter;