const express = require('express');
const router = express.Router();
const { chkAuth } = require('../midlewares/chkAuth');

const { createStory } = require('../controllers/stories');

router.post('/', chkAuth, createStory)

module.exports = router;