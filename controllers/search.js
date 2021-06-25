const Post = require('../models/posts');
const User = require('../models/users');


module.exports.allSearch = async (req, res) => {
    const { q: searchQuery, searchTerm, page } = req.query;
    let result;
    const LIMIT = 6;
    const startIndex = (Number(page || 1) - 1) * LIMIT;
    const titles = new RegExp(searchTerm, 'i');
    const users = new RegExp(searchTerm, 'i');
    const splitTags = searchTerm.replace(/#/g, " ").split(" ").filter(c => c.length > 0).map(c => new RegExp(c, 'i'));
    try {
        if(searchQuery === "top") {
            const totalPosts = await Post.find(
                {$or: [
                    {title: titles, isPrivate: false}, 
                    {userBioName: users, isPrivate: false}, 
                    {tags: {$in: splitTags}, isPrivate: false}]
                }
            ).countDocuments();
            const resultPosts = await Post.find({$or: [{title: titles, isPrivate: false}, {userBioName: users, isPrivate: false}, {tags: {$in: splitTags}, isPrivate: false}]}).sort({'createdAt': -1}).limit(LIMIT).skip(startIndex)
            const totalUsers = await User.find({userBioName: users}).countDocuments();
            const resultUsers = await User.find({userBioName: users}).sort({'userBioName': 1}).limit(LIMIT).skip(startIndex)
            result = {
                users: {
                    users: resultUsers,
                    currentPage: Number(page) || 1,
                    numberOfPages: Math.ceil(totalUsers / LIMIT)
                },
                posts: {
                    posts: resultPosts,
                    currentPage: Number(page) || 1,
                    numberOfPages: Math.ceil(totalPosts / LIMIT)
                }
            }
        } else if(searchQuery === "users") {
            const totalUsers = await User.find({userBioName: users}).countDocuments();
            const resultUsers = await User.find({userBioName: users}).sort({'userBioName': 1}).limit(LIMIT).skip(startIndex)
            result = {
                users: {
                    users: resultUsers,
                    currentPage: Number(page) || 1,
                    numberOfPages: Math.ceil(totalUsers / LIMIT)
                }
            }
        } else if(searchQuery === "posts") {
            const totalPosts = await Post.find({$or: [{title: titles, isPrivate: false}, {userBioName: users, isPrivate: false}, {tags: {$in: splitTags}, isPrivate: false}]}).countDocuments();
            const resultPosts = await Post.find({$or: [{title: titles, isPrivate: false}, {userBioName: users, isPrivate: false}, {tags: {$in: splitTags}, isPrivate: false}]}).sort({'createdAt': -1}).limit(LIMIT).skip(startIndex)
            result = {
                posts: {
                    posts: resultPosts,
                    currentPage: Number(page) || 1,
                    numberOfPages: Math.ceil(totalPosts / LIMIT)
                }
            }
        }
        return res.json(result)
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "something is wrong"})
    }
}