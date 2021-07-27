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
            if(!user) {
                return res.status(404).json({error: "User not found"})
            } else {
                req.user = user;
            }
            return next();
        }
    }
}

module.exports = { chkAuth };