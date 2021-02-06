const Post = require('../models/posts');


const getMyPosts = async(req, res) => {
    const { userName } = req.user;
    try {
        const posts = await Post.find({userName}).sort({createdAt: -1});
        return res.json(posts)
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something is wrong"})
    }
}

module.exports = { getMyPosts };
