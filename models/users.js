const { model, Schema } = require('mongoose')


const userChema = new Schema({
    userId: String,
    userName: String,
    userBioName: String,
    userImage: String
})

module.exports = model('User', userChema);