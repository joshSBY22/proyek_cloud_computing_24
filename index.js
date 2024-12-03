const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const router = require("./src/routes/routes");

const port = 3000;
app.listen(port, function () {
	console.log(`listening on port ${port}`);
});
