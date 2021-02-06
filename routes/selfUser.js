const express = require('express');
const router = express.Router();
const { chkAuth } = require('../midlewares/chkAuth');

const { getMyPosts } = require('../controllers/selfUser');

router.get('/', chkAuth, getMyPosts)

module.exports = router;