const express = require('express');
const router = express.Router();
const { chkAuth } = require('../midlewares/chkAuth');

const { createStory, addToStory, getStory, commentStory, deleteStory } = require('../controllers/stories');

router.post('/', chkAuth, createStory)
router.get('/:storyId', getStory);
router.patch('/:storyId/add', chkAuth, addToStory)
router.delete('/:storyId/:subStoryId', chkAuth, deleteStory)
router.patch('/:storyId/:subStoryId/comment', chkAuth, commentStory)


module.exports = router;