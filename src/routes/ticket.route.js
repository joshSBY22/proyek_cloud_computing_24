const express = require('express');
const ticketRouter = express.Router();
const ticketController = require('../controllers/ticket.controller');

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
});

ticketRouter.get('/all', ticketController.getAll);

ticketRouter.get('/:id_ticket', ticketController.getById);

ticketRouter.post('/',upload.single('image_file'), ticketController.create);

ticketRouter.put('/:id_ticket', ticketController.update);

ticketRouter.delete('/:id_ticket', ticketController.remove);

module.exports = ticketRouter;