const User = require('../models/users');
const jwt = require('jsonwebtoken');

const chkAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(400).json({error: 'Must have header'})
    } else {
        if(!authHeader.startsWith('Bearer')){
            return res.status(400).json({error: 'Header must start with "Bearer"'})
        } else {
            const token = authHeader.split('Bearer ')[1];
            const decodedUser = jwt.decode(token);
            const user = await User.findOne({userName: decodedUser.email});
            if(user) {
                req.user = {
                    userName: user.userName,
                    userBioName: user.userBioName,
                    userImage: user.userImage,
                    userId: user.userId
                };
            } else {
                const newUser = new User({
                    userName: decodedUser.email,
                    userBioName: decodedUser.name,
                    userImage: decodedUser.picture,
                    userId: decodedUser.sub
                })
                await newUser.save();
                req.user = newUser;
            }
            return next();
        }
    }
}

module.exports = { chkAuth };