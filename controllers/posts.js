const mongoose = require('mongoose');
const Post = require('../models/posts');
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const { postValidate } = require('../utils/validators');
const { cloudinary } = require('../utils/cloundinary')

module.exports.getPosts = async (req, res) => {
    const { page } = req.query;
    try {
        const LIMIT = 6;
        const startIndex = (Number(page) - 1) * LIMIT;
        const total = await Post.countDocuments()
        const posts = await Post.find({isPrivate: false}).sort({'createdAt': -1}).limit(LIMIT).skip(startIndex);
        return res.json({
            posts,
            currentPage: Number(page),
            numberOfPages: Math.ceil(total / LIMIT)
        })
    } catch (error) {
        return res.status(500).json({error: "Something is wrong"})
    }
}

module.exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({'createdAt': -1});
        return res.json(posts)
    } catch (error) {
        return res.status(500).json({error: "Something is wrong"})
    }
}

module.exports.getPost = async (req, res) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(id);
        if(post) {
            if(post.isPrivate){
                if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')){
                    return res.status(401).json({error: "Unorthorized"})
                } else {
                    const token = req.headers.authorization.split('Bearer ')[1];
                    const decodedUser = jwt.decode(token);
                    const user = await User.findOne({userName: decodedUser.email});
                    if(user && post.privateAccess.find(allow => allow.userName === user.userName)){
                        return res.json(post)
                    } else if(user && post.userName === user.userName){
                        return res.json(post)
                    } else {
                        return res.status(401).json({error: "Unorthorized"})
                    }
                }
            } else {
                return res.json(post)
            }
        } else {
            return res.status(404).json({error: "No post found"})
        }
    } catch(err){
        console.log(err)
        return res.status(500).json({error: "Something is wrong"})
    }
}

const sharePrivate = (req, res) => {

}

const recieveShare = (req, res) => {

}

const createSpecial = (req, res) => {

}
// const getSignature = (req, res) => {
//     try {
//         let timestamp = Math.round((new Date).getTime()/1000);
//         const signature = cloudinary.utils.api_sign_request({
//             timestamp,
//             api_key: process.env.CLOUDINARY_API_KEY,
//             upload_preset: "dev_Nhan"
//         }, process.env.CLOUDINARY_API_SECRET)
//         return res.json({
//             timestamp,
//             signature
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({error: "Something is wrong"})
//     }
// }
// const createPostWithSignature = (req, res) => {
//     try {
        
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({error: "Something is wrong"})
//     }
// }

module.exports.createPost  = async (req, res) => {
    try {
        const { title, message, selectedFiles, tags, isPrivate } = req.body;
        const { valid, errors } = postValidate(req.body);
        if(!valid) return res.status(400).json(errors)
        const { userName, userBioName, userImage, userId } = req.user;
        const baseImages = selectedFiles.map(file => file.base64);
        let newTags = tags.split(/[#.,\/ -]/).map(tag => tag.trim()).filter(tag => tag).length > 0 ? tags.split(/[#.,\/ -]/).map(tag => tag.trim()).filter(tag => tag) : ["noTag"];  
        const createdAt = new Date().toISOString();
        let upload_promises = baseImages.map(file => new Promise((resolve, reject) => {
                cloudinary.uploader.upload(file, { upload_preset: 'dev_Nhan', resource_type: "auto"}, function (error, result) {
                    if(error) reject(error)
                    else resolve({
                        resource_type: result.resource_type,
                        public_id: result.public_id,
                        url: result.url
                    })
                })
            })
        )
        Promise.all(upload_promises)
            .then(async (result) =>  {
                let newPost = new Post({ 
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
                // console.log(result)
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
module.exports.deleteDefaultPost = async (req, res) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(id);
        if(post) {
            await Post.findByIdAndDelete(id);
            return res.json({message: "Post deleted successfully"})
        }
    } catch (error) {
        return res.status(500).json({error: "Something is wrong"})
    }
}
module.exports.updatePost = async (req, res) => {
    const { id: _id } = req.params;
    const post = req.body;
    if(!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).json({error: "No post found"});
    const updatePost = await Post.findByIdAndUpdate(_id, {...post, _id}, {new: true});
    return res.json(updatePost);
}

module.exports.changePrivate = async(req, res) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(id);
        if(req.user.userId === post.userId) {
            const updatePost = await Post.findByIdAndUpdate(id, { isPrivate: !post.isPrivate }, {new: true})
            return res.json(updatePost)
        } else {
            return res.status(400).json({error: "Not allowed"})
        }        
    } catch (error) {
        return res.status(500).json({error: "Something is wrong"})
    }
}

module.exports.deletePost = async (req, res) => {
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

module.exports.likePost = async(req,res) => {
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

module.exports.commentPost = async(req, res) => {
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

module.exports.likeComment = async (req, res) => { // like an comment
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

module.exports.replyComment = async (req, res) => { // reply a comment
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

