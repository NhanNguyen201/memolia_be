const express = require('express');
const router = express.Router();

const { 
    getPosts, 
    getAllPosts,
    getPost, 
    createPost, 
    updatePost, 
    editPost,
    changePrivate,
    deletePost, 
    deleteDefaultPost, 
    likePost, 
    commentPost, 
    likeComment, 
    replyComment 
}  = require('../controllers/posts');

// 
    
const { chkAuth } = require('../midlewares/chkAuth');

router.get('/', getPosts);
router.get('/all', getAllPosts);
router.get('/:id', getPost);
router.post('/', chkAuth ,createPost)
router.patch('/:id', chkAuth, updatePost);
router.patch('/:id/edit', chkAuth, editPost);
router.patch('/:id/private', chkAuth, changePrivate);
router.patch('/:id/like', chkAuth, likePost);
router.patch('/:id/comment', chkAuth, commentPost);
router.delete('/:id', chkAuth, deletePost);
router.delete('/:id/admin', deleteDefaultPost);

router.patch('/:id/comments/:commentId/like', chkAuth, likeComment)
router.patch('/:id/comments/:commentId/comment', chkAuth, replyComment)

module.exports = router;