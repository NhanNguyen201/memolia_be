const mongoose = require('mongoose');
const Post = require('../models/posts');
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const got = require('got');

const { postValidate } = require('../utils/validators');
const { cloudinary } = require('../utils/cloundinary')

module.exports.getPosts = async (req, res) => {
    const { page } = req.query;
    try {
        const LIMIT = 6;
        const startIndex = (Number(page) - 1) * LIMIT;
        const total = await Post.find({isPrivate: false}).countDocuments()
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
       
    } catch(err){
        console.log(err)
        return res.status(500).json({error: "Something is wrong"})
    }
}

module.exports.createPost  = async (req, res) => {
    try {
        const { title, message, selectedFiles, tags, isPrivate } = req.body;
        const { valid, errors } = postValidate(req.body);
        if(!valid) return res.status(400).json(errors)
        const { userName, userBioName, userImage, userId } = req.user;
        const baseImages = selectedFiles.map(file => file.base64);
        let newTags = tags.map(tag => tag.trim().replace(/[#.,\/ -]/, "")).filter(tag => tag);  
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
                if(newTags.length === 0) {
                    if( result.find(file => file.resource_type === 'image')) {
                        let imageToTag = result.find(file => file.resource_type === 'image');
                        const imaggaRes = await got(`https://api.imagga.com/v2/tags?image_url=${encodeURIComponent(imageToTag.url)}`, {username: process.env.IMAGGA_API_KEY, password: process.env.IMAGGA_API_SECRET});
                        const tagsResult = JSON.parse(imaggaRes.body).result.tags;
                        newTags = tagsResult.slice(0, 5).map(tag => tag.tag.en)
                    } else {
                        newTags = ["noTag"]
                    }
                }
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

module.exports.editPost = async(req, res) => {
    const { id } = req.params;
    let { title, message, selectedFiles, newFiles, tags } = req.body; 

    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(id);
        if(req.user.userId === post.userId) {
            const imageToRemove = post.selectedFiles.filter(file => !selectedFiles.find(newFile => newFile.public_id === file.public_id))
            if(imageToRemove.length > 0) {
                const removePromises = imageToRemove.map(file => new Promise((resolve, reject) => {
                    cloudinary.uploader.destroy(file.public_id, (error, result) => {
                        if(error) reject(error)
                    })
                }))
                Promise.all(removePromises)
                .catch(error => {
                    throw error
                })
            }
            if(newFiles.length > 0){ 
                const uploadPromise = newFiles.map(file => new Promise((resolve, reject) => {
                    cloudinary.uploader.upload(file.base64, { upload_preset: 'dev_Nhan', resource_type: "auto"}, (error, result) => {
                        if(error) reject(error)
                        else resolve({
                            resource_type: result.resource_type,
                            public_id: result.public_id,
                            url: result.url
                        })
                    })
                }))
                Promise.all(uploadPromise)
                    .then(async(result) => {
                        let newTags;
                        selectedFiles = [...selectedFiles, ...result]
                        if(tags.length === 0 && result.find(file => file.resource_type === 'image')){
                            let imageToTag = result.find(file => file.resource_type === 'image');
                            const imaggaRes = await got(`https://api.imagga.com/v2/tags?image_url=${imageToTag.url}`, {username: process.env.IMAGGA_API_KEY, password: process.env.IMAGGA_API_SECRET});
                            const tagsResult = JSON.parse(imaggaRes.body).result.tags;
                            newTags = tagsResult.slice(0, 5).map(tag => tag.tag.en)
                        }
                        const updatePost = await Post.findByIdAndUpdate(id, { title: title, message: message || post.message, selectedFiles: selectedFiles, tags: tags || newTags}, {new: true});
                        return res.json(updatePost)
                    })
                    .catch(error => {
                        throw error;
                    })
            } else {
                const updatePost = await Post.findByIdAndUpdate(id, { title: title, message: message || post.message, selectedFiles: selectedFiles, tags: tags || newTags}, {new: true});
                return res.json(updatePost)
            }
        } else {
            return res.status(400).json({error: "Not allowed"})
        }        
    } catch (error) {
        return res.status(500).json({error: "Something is wrong"})
    }
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
            Promise.all(post.selectedFiles.map(file => new Promise((resolve, reject) => {
                    cloudinary.uploader.destroy(file.public_id, (error, result) => {
                        if(error) { 
                            reject(error) 
                        } else resolve(result)
                    })
                }))
            )
            .then(async () => {
                await Post.findByIdAndDelete(id);
                return res.json({message: "Deleted successfully"})
            })
            .catch(error => {
                throw error
            })
        } else {
            return res.status(400).json({error: "Not allowed"})
        }        
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: "Something is wrong"})
    }
}

module.exports.likePost = async(req,res) => {
    const { id } = req.params;
    const { emoji } = req.body;
    if(!['like', 'love', 'haha', 'wow', 'sad', 'angry'].includes(emoji)) return res.status(400).json({error: "Invalid emoji"});
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(id);
        let { reactions } = post;
        const isLike = reactions.find(like => like.userId === req.user.userId);
        if(isLike){
            if(isLike.emoji === emoji){
                reactions = reactions.filter(like => like.userId !== req.user.userId)
            } else {
                reactions = reactions.filter(like => like.userId !== req.user.userId)
                reactions.push({
                    emoji,
                    userId: req.user.userId,
                    userName: req.user.userName,
                    userBioName: req.user.userBioName,
                    userImage: req.user.userImage,
                })
            }
        } else {
            reactions.push({
                emoji,
                userId: req.user.userId,
                userName: req.user.userName,
                userBioName: req.user.userBioName,
                userImage: req.user.userImage,
            })
        }
        const updatePost = await Post.findByIdAndUpdate(id, { reactions }, {new: true});
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
    const { emoji } = req.body;
    const { userId, userName, userBioName, userImage } = req.user;
    if(!['like', 'love', 'haha', 'wow', 'sad', 'angry'].includes(emoji)) return res.status(400).json({error: "Invalid emoji"});
    if(!mongoose.Types.ObjectId.isValid(postId)) return res.status(404).json({error: "No post found"});
    try {
        const post = await Post.findById(postId);
        let { comments } = post;
        const targetComment = comments.findIndex(comment => comment._id == commentId);
        if(targetComment > -1) {
            const isLiked = comments[targetComment].reactions.find(like => like.userId === userId)
            if(isLiked) {
                if(isLiked.emoji === emoji) {
                    comments[targetComment].reactions = comments[targetComment].reactions.filter(like => like.userId !== userId)
                } else {
                    comments[targetComment].reactions = comments[targetComment].reactions.filter(like => like.userId !== userId)
                    comments[targetComment].reactions.push({
                        emoji,
                        userId,
                        userName,
                        userBioName,
                        userImage
                    })
                }
            } else {
                comments[targetComment].reactions.push({
                    emoji,
                    userId,
                    userName,
                    userBioName,
                    userImage
                })
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
        const targetComment = comments.findIndex(comment => comment._id == commentId);
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

