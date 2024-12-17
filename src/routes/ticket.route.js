const express = require('express');
const ticketRouter = express.Router();
const ticketController = require('../controllers/ticket.controller');

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
});

ticketRouter.get('/', ticketController.getAll);

ticketRouter.get('/:id', ticketController.getById);

ticketRouter.post('/',upload.single('imageFile'), ticketController.create);

ticketRouter.put('/', ticketController.update);

ticketRouter.delete('/', ticketController.remove);

module.exports = ticketRouter;