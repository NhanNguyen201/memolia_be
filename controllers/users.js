const User = require('../models/users');
const Post = require('../models/posts');
const Story = require('../models/stories');
module.exports.getOneUser = async (req, res) => {
    const { userId } = req.params;
    // const result = {};
    try {
        const user = await User.findOne({userId});
        if(user){
            // result.userData = user;            
            const posts = await Post.find({userId, isPrivate: false}).sort({createdAt: -1})
            const stories = await Story.find({userId}).sort({moderatedAt: -1})
            
            return res.json({
                userData: user,
                posts,
                stories
            })
        } else {
            return res.status(404).json({error: "User not found"})
        }
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
}
