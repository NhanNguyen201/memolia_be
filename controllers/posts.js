const mongoose = require('mongoose');
const Post = require('../models/posts');
const { postValidate } = require('../utils/validators');
const { cloudinary } = require('../utils/cloundinary')
const getPosts = async (req, res) => {
    try {
        const posts = await Post.find({isPrivate: false}).sort({'createdAt': -1});
        return res.json(posts)
    } catch (error) {
        return res.status(500).json({error: "Something is wrong"})
    }
}

const getPost = async (req, res) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(id);
        return res.json(post);
    } catch(err){
        return res.status(500).json({error: "Something is wrong"})
    }
}

const createPost  = async (req, res) => {
    try {
        const { title, message, selectedFiles, tags, isPrivate } = req.body;
        const { valid, errors } = postValidate(req.body);
        if(!valid) return res.status(400).json(errors)

        const { userName, userBioName, userImage, userId } = req.user;
        const baseImages = selectedFiles.map(file => file.base64);
        const newTags = tags.split(',').map(tag => tag.trim());     
        const createdAt = new Date().toISOString();
        let res_promises = baseImages.map(file => new Promise((resolve, reject) => {
                cloudinary.uploader.upload(file, { upload_preset: 'dev_Nhan' }, function (error, result) {
                    if(error) reject(error)
                    else resolve(result.url)
                })
            })
        )
        Promise.all(res_promises)
            .then(async (result) =>  {
                var newPost = new Post({ 
                    title, 
                    message, 
                    userName,
                    userImage,
                    userBioName,
                    userId,
                    tags: newTags,
                    selectedFiles: result,
                    isPrivate,
                    createdAt
                })
                await newPost.save()
                return res.json(newPost);
            })
            .catch((error) => {
                console.log(error);
                return res.status(500).json({error: "Something is wrong"})
            })
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something is wrong"})
    }
}

const updatePost = async (req, res) => {
    const { id: _id } = req.params;
    const post = req.body;
    if(!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).json({error: "No post found"});
    const updatePost = await Post.findByIdAndUpdate(_id, {...post, _id}, {new: true});
    return res.json(updatePost);
}

const deletePost = async (req, res) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(id);
        if(req.user.userId === post.userId) {
            await Post.findByIdAndDelete(id);
            return res.json({message: "Post deleted successfully"})
        } else {
            return res.status(400).json({error: "Not allowed"})
        }        
    } catch (error) {
        return res.status(500).json({error: "Something is wrong"})
    }
}

const likePost = async (req,res) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(id);
        var { likes } = post;
        const isLike = likes.find(like => like.userId === req.user.userId);
        if(isLike){
            likes = likes.filter(like => like.userId !== req.user.userId)
        } else {
            likes.push({
                userId: req.user.userId,
                userName: req.user.userName,
                userBioName: req.user.userBioName,
                userImage: req.user.userImage,
            })
        }
        const updatePost = await Post.findByIdAndUpdate(id, { likeCount: likes.length, likes }, {new: true});
        return res.json(updatePost);    
    } catch (error) {
        console.log(error);
        return res.status(500).json({error})
    }
}

const commentPost = async(req, res) => {
    const { id } = req.params;
    const { body } = req.body;
    const { userId, userName, userBioName, userImage } = req.user;
    const createdAt = new Date().toISOString();
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(id);
        post.comments = [{userId, userName, userBioName, userImage, body, createdAt}, ...post.comments];
        const updatePost = await Post.findByIdAndUpdate(id, {commentCount: post.comments.length, comments: post.comments}, {new: true});
        return res.json(updatePost);
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something is wrong"})
    }
}

const likeComment = async (req, res) => { // like an comment
    const { id: postId, commentId } = req.params;
    const { userId, userName, userBioName, userImage } = req.user;
    if(!mongoose.Types.ObjectId.isValid(postId)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(postId);
        var { comments } = post;
        const targetComment = comments.findIndex(comment => comment._id === commentId);
        if(targetComment > -1) {
            if(comments[targetComment].likes.find(like => like.userId === userId)){
                comments[targetComment].likes = comments[targetComment].likes.filter(like.userId !== userId)
            } else {
                comments[targetComment].likes.push({
                    userId,
                    userBioName,
                    userName,
                    userImage
                })
                comments[targetComment].likeCount = comments[targetComment].likes.length;
            }
            const updatePost = await Post.findByIdAndUpdate(postId, {comments}, {new: true})
            return res.json(updatePost)
        } else {
            return res.status(404).json({error: "Comment not found"})
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something is wrong"})
    }
}

const replyComment = async (req, res) => { // reply a comment
    const { id: postId, commentId } = req.params;
    const { body } = req.body;
    const { userId, userName, userBioName, userImage } = req.user;
    if(!mongoose.Types.ObjectId.isValid(postId)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(postId);
        var { comments } = post;
        const createdAt = new Date().toISOString();
        const targetComment = comments.findIndex(comment => comment._id === commentId);
        if(targetComment > -1) {
            comments[targetComment].replies.unshift({
                userId,
                userName,
                userBioName,
                userImage,
                body,
                createdAt
            })
            comments[targetComment].replyCount = comments[targetComment].replies.length;
            const updatePost = await Post.findByIdAndUpdate(postId, {comments}, {new: true})
            return res.json(updatePost)
        } else {
            return res.status(404).json({error: "Comment not found"})
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something is wrong"})
    }
} 

module.exports = { getPosts, getPost, createPost, updatePost, deletePost, likePost, commentPost, likeComment, replyComment }