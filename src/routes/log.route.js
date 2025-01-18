const express = require('express');
const logRouter = express.Router();
const logController = require('../controllers/log.controller');

logRouter.get('/all', logController.getAll);

logRouter.get('/:id_log', logController.getById);

module.exports = logRouter;