const User = require('../models/users');
const Post = require('../models/posts');
const Story = require('../models/stories');

module.exports.getOneUser = async (req, res) => {
    const { userId } = req.params;
    const { page } = req.query;
    try {
        const user = await User.findOne({userId});
        if(user){
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

module.exports.followUser = async (req, res) => {
    const { userId } = req.params;
    const { user: auth } = req;
    try {
        let followingRes = [];
        const userDoc = await User.findOne({userId});
        const selfDoc = await User.findById(auth._id)
        if(userDoc) {
            if(auth.followings.find(f => f.userId == userDoc.userId)){
                if(userDoc.followers.find(f => f.userId == auth.userId)){
                    followingRes = auth.followings.filter(f => f.userId !== userDoc.userId)
                    await userDoc.update({followers: userDoc.followers.filter(f => f.userId !== auth.userId)})
                } else {
                    followingRes = auth.followings.filter(f => f.userId !== userDoc.userId)
                }
            } else {
                if(userDoc.followers.find(f => f.userId == auth.userId)){
                    followingRes = auth.followings;
                    followingRes.push({userId: userId})
                } else {
                    let userFollowers = userDoc.followers;
                    userFollowers.push({userId: auth.userId})
                    followingRes = auth.followings;
                    followingRes.push({userId: userId})
                    await userDoc.update({followers: userFollowers})
                }
            }
            await selfDoc.update({followings: followingRes})
            return res.json({followings: followingRes})
        } else {
            return res.status(404).json({error: "User not found"})

        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: "something is wrong"})
    }
}
