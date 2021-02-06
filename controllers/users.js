const User = require('../models/users');
const Post = require('../models/posts');

const getOneUser = async (req, res) => {
    const { userId } = req.params;
    const result = {};
    try {
        const user = await User.findOne({userId});
        if(user){
            result.userData = user;            
            const posts = await Post.find({userId, isPrivate: false}).sort({'createdAt': -1})
            result.posts = posts;
            return res.json(result)
        } else {
            return res.status(404).json({error: "User not found"})
        }
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
}

module.exports = { getOneUser };