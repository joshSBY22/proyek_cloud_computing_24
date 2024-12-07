async function create(req, res) {
  return res.status(200).send({ message: 'POST /ticket' });
}

async function getAll(req, res) {
  return res.status(200).send({ message: 'GET /ticket' });
}

async function getById(req, res) {
  return res.status(200).send({ message: 'GET /ticket with id ' + req.params.id });
}

async function update(req, res) {
  return res.status(200).send({ message: 'PUT /ticket' });
}

async function remove(req, res) {
  return res.status(200).send({ message: 'DELETE /ticket' });
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove
}