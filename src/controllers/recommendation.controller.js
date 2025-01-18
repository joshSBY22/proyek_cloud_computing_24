const axios = require("axios");

const getRecommendation = async (req, res) => {
	try {
		const { username } = req.params;
		const formData = new FormData();
		formData.append("username", username);

		const response = await axios.post(
			"https://asia-southeast2-proyek-cloud-computing-442912.cloudfunctions.net/recommendation-system",
			formData
		);
		res.status(200).json(response.data);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getRecommendation,
};
