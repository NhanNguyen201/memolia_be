const express = require('express');
const router = express.Router();

const { getOneUser } = require('../controllers/users');

router.get('/:userId', getOneUser)

module.exports = router;