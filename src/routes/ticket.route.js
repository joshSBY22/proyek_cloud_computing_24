  const express = require('express');
  const ticketRouter = express.Router();
  const ticketController = require('../controllers/ticket.controller');

  const multer = require("multer");

  const allowedFileExtension = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  const fileFilter = (req, file, cb) => {
    if (allowedFileExtension.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  const uploadMulterSingle = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024, // no larger than 2mb
    }
  }).single('image_file');

  const uploadMiddleware = (req, res, next) => {
    uploadMulterSingle(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size is too large. Maximum limit is 2MB.' });
        }
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      // Check if file exists and passes the filter
      if (!req.file) {
        return res.status(400).json({ message: 'Invalid file type. Allowed file types are: JPEG, PNG, JPG, GIF.' });
      }

      // proceed to the next middleware
      next();
    });
  };

  ticketRouter.get('/all', ticketController.getAll);

  ticketRouter.get('/nearby', ticketController.getTicketsNearby);

  ticketRouter.get('/:id_ticket', ticketController.getById);

  ticketRouter.post('/', uploadMiddleware, ticketController.create);

  ticketRouter.put('/:id_ticket', ticketController.update);

  ticketRouter.delete('/:id_ticket', ticketController.remove);

  module.exports = ticketRouter;