const db = require("../database/firestore");

const getAll = async (req, res) => {
	try {
		const logs = await db.collection("logs").get();
		const logList = [];
		logs.forEach((doc) => {
			logList.push({ id: doc.id, ...doc.data() });
		});
		res.status(200).json(logList);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getById = async (req, res) => {
    try {
        const log = await db.collection("logs").doc(req.params.id_log).get();
        if (!log.exists) {
            res.status(404).json({ message: "Log not found" });
        } else {
            res.status(200).json({ id: log.id, ...log.data() });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAll,
    getById,
};