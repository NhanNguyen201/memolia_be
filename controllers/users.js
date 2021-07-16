const User = require('../models/users');
const Post = require('../models/posts');
const Story = require('../models/stories');
module.exports.getOneUser = async (req, res) => {
    const { userId } = req.params;
    const { page } = req.query;
    try {
        const user = await User.findOne({userId});
        if(user){
            // result.userData = user;            
            const LIMIT = 6;
            const startIndex = (Number(page) - 1) * LIMIT;
            const total = await Post.find({userId, isPrivate: false}).countDocuments()
            const posts = await Post.find({userId, isPrivate: false}).sort({'createdAt': -1}).limit(LIMIT).skip(startIndex);
            const stories = await Story.find({userId}).sort({'moderatedAt': -1})
            return res.json({
                userData: user,
                stories,
                posts: {
                    posts,
                    currentPage: Number(page),
                    numberOfPages: Math.ceil(total / LIMIT)
                },
            })
        } else {
            return res.status(404).json({error: "User not found"})
        }
    } catch (error) {
        return res.status(500).json({error: "something is wrong"})
    }
}
