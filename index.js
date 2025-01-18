const express = require("express");
const dotenv = require("dotenv");
const app = express();

// Set up Global configuration access
dotenv.config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const userRouter = require("./src/routes/user.route");
const ticketRouter = require("./src/routes/ticket.route");
const logRouter = require("./src/routes/log.route.js");
const recommendationRouter = require("./src/routes/recommendation.route.js");

app.use("/api/user", userRouter);
app.use("/api/ticket", ticketRouter);
app.use("/api/log", logRouter);
app.use("/api/recommendation", recommendationRouter);

const port = process.env.PORT || 8080;
app.listen(port, function () {
	console.log(`listening on port ${port}`);
});
