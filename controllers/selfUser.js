const Post = require('../models/posts');
const Story = require('../models/stories');

const getMyPosts = async(req, res) => {
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

module.exports = { getMyPosts };
