const Post = require('../models/posts');
const User = require('../models/users');
const Story = require('../models/stories');
const jwt = require('jsonwebtoken');

module.exports.loginWithGoogle = async(req, res) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(400).json({error: 'Must have header'})
    } else {
        if(!authHeader.startsWith('Bearer')){
            return res.status(400).json({error: 'Header must start with "Bearer"'})
        } else {
            let userProfile = {}
            const token = authHeader.split('Bearer ')[1];
            const decodedUser = jwt.decode(token);
            const user = await User.findOne({userName: decodedUser.email});
            if(user) {
                userProfile = user;
            } else {
                const newUser = new User({
                    userName: decodedUser.email,
                    userBioName: decodedUser.name,
                    userImage: decodedUser.picture,
                    userId: decodedUser.sub,
                    followers: [],
                    followings: []
                })
                userProfile = await newUser.save();
            }
            return res.json(userProfile);
        }
    }
}

module.exports.getMyPosts = async(req, res) => {
    const { userName } = req.user;
    try {
        const posts = await Post.find({userName}).sort({'createdAt': -1});
        const stories = await Story.find({userName}).sort({'moderatedAt': -1});
        return res.json({
            posts,
            stories
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something is wrong"})
    }
}
