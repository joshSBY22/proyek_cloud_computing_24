const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const userRouter = require("./src/routes/user.route");
const ticketRouter = require("./src/routes/ticket.route");

app.use("/api/user", userRouter);
app.use("/api/ticket", ticketRouter); 

const port = 3000;
app.listen(port, function () {
	console.log(`listening on port ${port}`);
});
