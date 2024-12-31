const Joi = require("joi");

const {Storage} = require("@google-cloud/storage");
const db = require("../database/firestore");
const { formatCurrency, isValidLatitude, isValidLongitude } = require("../helper/number");
const { verifyToken } = require("../helper/jwtToken");
//Connect to Cloud Storage
const storage = new Storage({
  keyFilename: "app-key.json"
});
const bucketName = 'ticket-project-assets';

async function uploadFileToCloudStorage(file) {
  const bucket = storage.bucket(bucketName);

  const fileName = `${Date.now()}_${file.originalname}`;
  const blob = bucket.file(fileName);
  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: file.mimetype
    }
  });
  

  return new Promise((resolve, reject) => {
    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    }).on('error', (err) => {
      reject(err);
    }).end(file.buffer);
  });
}
//=================================================================

async function create(req, res) {
  const {ticket_title, ticket_price, ticket_description, ticket_location, ticket_latitude_longitude, ticket_type} = req.body;
  const schema = Joi.object({
    ticket_title: Joi.string().required().messages({
      'string.empty': "Ticket title is required",
      'any.required': "Ticket title is required"
    }),
    ticket_price: Joi.number().min(0).max(100000000).required().messages({
      'number.base': "Ticket price must be a number",
      'number.min': "Ticket price must be greater than or equal to 0",
      'number.max': "Maximum ticket price is 100000000",
      'number.empty': "Ticket price is required",
      'any.required': "Ticket price is required"
    }),
    ticket_description: Joi.string().required().messages({
      'string.empty': "Description is required",
      'any.required': "Description is required"
    }),
    ticket_location: Joi.string().required().messages({
      'string.empty': "Ticket location is required",
      'any.required': "Ticket location is required"
    }),
    ticket_latitude_longitude: Joi.string().required().messages({
      'string.empty': "Ticket latitude longitude is required",
      'any.required': "Ticket latitude longitude is required"
    }),
    ticket_type: Joi.string().valid("event", "place").required().messages({
      'string.empty': "Ticket type is required",
      "any.only": "Ticket type must be either 'event' or 'place'",
      'any.required': "Ticket type is required",
    }),
    start_datetime: Joi.date().iso().when('ticket_type', {
      is: "event",
      then: Joi.required().messages({
        'date.base': "Start datetime must be a valid date",
        'date.iso': "Start datetime must be in ISO 8601 format",
        'any.required': "Start datetime is required"
      })
    }),
    end_datetime: Joi.date().iso().when('ticket_type', {
      is: "event",
      then: Joi.required().messages({
        'date.base': "End datetime must be a valid date",
        'date.iso': "End datetime must be in ISO 8601 format",
        'any.required': "End datetime is required"
      })
    }),
  });

  let userUsername = null;

  //Token Validation
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

  //Schema Validation
  try{
    await schema.validateAsync(req.body, {abortEarly: false});
  }
  catch(error){
    if (error.isJoi) {
      // Joi validation error
      return res.status(400).send({
        message: error.details.map((detail) => detail.message).join(", ") || "Validation error",
      });
    }

    return res.status(500).send({ message: error.message });
  }

  const latitude_longitude = ticket_latitude_longitude.split(",");
  const latitude = String(latitude_longitude[0]).trim();
  const longitude = String(latitude_longitude[1]).trim();

  if(isNaN(latitude) || isNaN(longitude)){
    return res.status(400).send({message: "Latitude and Longitude must be a number and separated by comma ','"});
  }else if(!isValidLatitude(latitude) || !isValidLongitude(longitude)){
    return res.status(400).send({message: "Latitude must be between -90 and 90, Longitude must be between -180 and 180"});
  }

  const imageFile = req.file;
  
  if(imageFile){
    try{
      const imageUrl = await uploadFileToCloudStorage(imageFile);
      
      const newTicketId = `TIC${String((await db.collection("tickets").count().get()).data().count + 1).padStart(6, '0')}`;
      
      const newTicket = await db.collection('tickets').doc(newTicketId).set({
        title: ticket_title,
        price: ticket_price,
        description: ticket_description,
        street_location: ticket_location,
        imageUrl: imageUrl,
        latitude_position: latitude,
        longitude_position: longitude,
        type: ticket_type,
        start_datetime: ticket_type === "event" ? new Date(req.body.start_datetime) : null,
        end_datetime: ticket_type === "event" ? new Date(req.body.end_datetime) : null,
        creator: userUsername,
        status: "active"
      });

      return res.status(200).send({ 
        message: 'Ticket Created Successfullly',
        data: {
          ticket_id: newTicketId,
          title: ticket_title,
          price: formatCurrency(ticket_price),
          description: ticket_description,
          street_location: ticket_location,
          image_url: imageUrl,
          latitude_position: latitude,
          longitude_position: longitude,
          ticket_type: ticket_type,
          start_datetime: ticket_type === "event" ? req.body.start_datetime : null,
          end_datetime: ticket_type === "event" ? req.body.end_datetime : null,
          creator: userUsername,
          status: "active"
        },

      });
    }catch(error){
      console.log(error.message);
      return res.status(500).send({ message: `Failed to create ticket`, error: error.message });
    }
  }else{
    return res.status(400).send({message: "Image file is required"});
  }

}

async function getAll(req, res) {
  try {
    const ticketsSnapshot = await db.collection('tickets').where("status", "==", "active").get();

    // Check if the users collection is empty
    if (ticketsSnapshot.empty) {
      return res.status(404).send({ message: "No tickets found" });
    }

    // Map over the documents to extract data
    const tickets = ticketsSnapshot.docs.map(doc => ({
      ticket_id: doc.id, // Include document ID
      ...doc.data()
    }));

    // Send the tickets data as a response
    return res.status(200).send({ data: tickets });
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error", error: error.message });
  }

}

async function getById(req, res) {
  const { id_ticket } = req.params;
  try {

    const ticket = await db.collection('tickets').doc(id_ticket).get();

    // Check if ticket exist
    if (!ticket.exists) {
      return res.status(404).send({ message: "Ticket not found" });
    }

    const getTicketData = ticket.data();

    const ticketData = {
      ticket_id: ticket.id,
      title: getTicketData.title,
      price: formatCurrency(getTicketData.price),
      description: getTicketData.description,
      street_location: getTicketData.street_location,
      image_url: getTicketData.imageUrl,
      latitude_position: getTicketData.latitude_position,
      longitude_position: getTicketData.longitude_position,
      ticket_type: getTicketData.type,
      start_datetime: getTicketData.start_datetime,
      end_datetime: getTicketData.end_datetime,
      creator: getTicketData.creator,
      status: getTicketData.status
    };

    // Send the ticket data 
    return res.status(200).send({ data: ticketData });
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error", error: error.message });
  }

}

async function update(req, res) {
  const { id_ticket } = req.params;

  const schema = Joi.object({
    ticket_title: Joi.string().messages({
      'string.empty': "Ticket title is required",
    }),
    ticket_price: Joi.number().min(0).max(100000000).messages({
      'number.base': "Ticket price must be a number",
      'number.min': "Ticket price must be greater than or equal to 0",
      'number.max': "Maximum ticket price is 100000000",
      'number.empty': "Ticket price is required",
    }),
    ticket_description: Joi.string().messages({
      'string.empty': "Description is required",
    }),
    ticket_location: Joi.string().messages({
      'string.empty': "Ticket location is required",
    }),
    ticket_latitude_longitude: Joi.string().messages({
      'string.empty': "Ticket latitude longitude is required",
    }),
    ticket_type: Joi.string().valid("event", "place").messages({
      'string.empty': "Ticket type is required",
      "any.only": "Ticket type must be either 'event' or 'place'",
    }),
    start_datetime: Joi.date().iso().when('ticket_type', {
      is: "event",
      then: Joi.required().messages({
        'date.base': "Start datetime must be a valid date",
        'date.iso': "Start datetime must be in ISO 8601 format",
        'any.required': "Start datetime is required"
      })
    }),
    end_datetime: Joi.date().iso().when('ticket_type', {
      is: "event",
      then: Joi.required().messages({
        'date.base': "End datetime must be a valid date",
        'date.iso': "End datetime must be in ISO 8601 format",
        'any.required': "End datetime is required"
      })
    }),
  });

  let userUsername = null;

  //Token Validation
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


  //Schema Validation
  try{
    await schema.validateAsync(req.body, {abortEarly: false});
  }
  catch(error){
    if (error.isJoi) {
      // Joi validation error
      return res.status(400).send({
        message: error.details.map((detail) => detail.message).join(", ") || "Validation error",
      });
    }

    return res.status(500).send({ message: error.message });
  }

  try {
    const ticket = await db.collection('tickets').doc(id_ticket).get();

    // Check if ticket exist
    if (!ticket.exists) {
      return res.status(404).send({ message: "Ticket not found" });
    }

    if(ticket.data().creator !== userUsername){
      return res.status(401).send({ message: "Only can update ticket created by you" });
    }

    if(ticket.data().status === "deleted"){
      return res.status(400).send({ message: "Ticket is already deleted" });
    }

    const latitude_longitude = req.body.ticket_latitude_longitude ? req.body.ticket_latitude_longitude.split(",") : [];
    const latitude = latitude_longitude.length > 0 ? String(latitude_longitude[0]).trim() : null;
    const longitude = latitude_longitude.length > 0 ? String(latitude_longitude[1]).trim() : null;
    
    //Check if latitude and longitude is a number and valid
    if(latitude_longitude.length > 0){
      if(isNaN(latitude) || isNaN(longitude)){
        return res.status(400).send({message: "Latitude and Longitude must be a number and separated by comma ','"});
      }else if(!isValidLatitude(latitude) || !isValidLongitude(longitude)){
        return res.status(400).send({message: "Latitude must be between -90 and 90, Longitude must be between -180 and 180"});
      }
    }

    const ticketOldValue = (await db.collection('tickets').doc(id_ticket).get()).data();

    const updateTicket = await db.collection('tickets').doc(id_ticket).update({
      title: req.body.ticket_title ?? ticketOldValue.title,
      price: req.body.ticket_price ?? ticketOldValue.price,
      description: req.body.ticket_description ?? ticketOldValue.description,
      street_location: req.body.ticket_location ?? ticketOldValue.street_location,
      latitude_position: latitude ?? ticketOldValue.latitude_position,
      longitude_position: longitude ?? ticketOldValue.longitude_position,
      type: req.body.ticket_type ?? ticketOldValue.type,
      start_datetime: req.body.ticket_type ? 
        req.body.ticket_type === "event" ? new Date(req.body.start_datetime) : null
        : ticketOldValue.start_datetime,
      end_datetime: req.body.ticket_type ? 
        req.body.ticket_type === "event" ? new Date(req.body.end_datetime) : null
        : ticketOldValue.end_datetime,
    });
    
    // Get updated ticket data
    const updatedValue = (await db.collection("tickets").doc(id_ticket).get()).data();

    return res.status(200).send({ 
      message: `Ticket ${id_ticket} updated successfully!`,
      data: {
        ticket_id: id_ticket,
        title: updatedValue.title,
        price: formatCurrency(updatedValue.price ?? 0),
        description: updatedValue.description,
        street_location: updatedValue.street_location,
        image_url: updatedValue.imageUrl,
        latitude_position: updatedValue.latitude_position,
        longitude_position: updatedValue.longitude_position,
        ticket_type: updatedValue.type,
        start_datetime: updatedValue.start_datetime,
        end_datetime: updatedValue.end_datetime,
        creator: updatedValue.creator,
        status: updatedValue.status
      }
    });
    
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error", error: error.message });
  }
}

async function remove(req, res) {
  const { id_ticket } = req.params;

  try {
    const ticket = await db.collection('tickets').doc(id_ticket).get();

    // Check if ticket exist
    if (!ticket.exists) {
      return res.status(404).send({ message: "Ticket not found" });
    }

    if(ticket.data().status === "deleted"){
      return res.status(400).send({ message: "Ticket is already deleted" });
    }

    //update ticket status to deleted
    const deleteTicket = await db.collection('tickets').doc(id_ticket).update({
      status: "deleted"
    });

    return res.status(200).send({ message: `Ticket ${id_ticket} removed successfully!` });
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error", error: error.message });
  }

}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove
}