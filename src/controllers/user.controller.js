async function create(req, res) {
  return res.status(200).send({ message: 'POST /user' });
}

async function getAll(req, res) {
  return res.status(200).send({ message: 'GET /user' });
}

module.exports = {
  create,
  getAll
}