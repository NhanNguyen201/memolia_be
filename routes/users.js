const express = require('express');
const router = express.Router();

const { getOneUser, followUser } = require('../controllers/users');

router.get('/:userId', getOneUser)
router.patch('/:userId/follow', followUser);
module.exports = router;