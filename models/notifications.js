const { model, Schema } = require('mongoose')


module.exports = model('Notification', new Schema({
    userId: String,
    notiType: String,
    senderId: String,
    senderUserName: String,
    senderBioName: String,
    senderImage: String,
    postId: String,
    body: String,
    isSeen: {
        type: Boolean,
        default: false
    }, 
    createdAt: {
        type: String,
        default: new Date().toISOString()
    }   
}));