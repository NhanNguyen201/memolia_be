const express = require('express');
const router = express.Router();
const { chkAuth } = require('../midlewares/chkAuth');

const { createStory, addToStory, getStory } = require('../controllers/stories');

router.get('/:storyId', getStory);
router.post('/', chkAuth, createStory)
router.post('/:storyId/add', chkAuth, addToStory)

module.exports = router;