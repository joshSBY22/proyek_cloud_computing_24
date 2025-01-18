const express = require("express");

const recommendationRouter = express.Router();

const recommendationController = require("../controllers/recommendation.controller");

recommendationRouter.get(
	"/:username",
	recommendationController.getRecommendation
);

module.exports = recommendationRouter;
