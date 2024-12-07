const express = require('express');
const ticketRouter = express.Router();
const ticketController = require('../controllers/ticket.controller');

ticketRouter.get('/', ticketController.getAll);

ticketRouter.get('/:id', ticketController.getById);

ticketRouter.post('/', ticketController.create);

ticketRouter.put('/', ticketController.update);

ticketRouter.delete('/', ticketController.remove);

module.exports = ticketRouter;