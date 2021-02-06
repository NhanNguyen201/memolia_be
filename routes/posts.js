const express = require('express');
const router = express.Router();

const { getPosts, getPost, createPost, updatePost, deletePost, likePost, commentPost, likeComment, replyComment } = require('../controllers/posts');
const { chkAuth } = require('../midlewares/chkAuth');

router.get('/', getPosts)
router.get('/:id', getPost);
router.post('/', chkAuth ,createPost)
router.patch('/:id', chkAuth, updatePost);
router.patch('/:id/like', chkAuth, likePost);
router.patch('/:id/comment', chkAuth, commentPost);
router.delete('/:id', chkAuth, deletePost);
router.patch('/:id/comments/:commentId/like', chkAuth, likeComment)
router.patch('/:id/comments/:commentId/comment', chkAuth, replyComment)

module.exports = router;