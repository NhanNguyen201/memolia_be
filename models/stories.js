const { model, Schema } = require('mongoose')


const storyChema = new Schema({
    userName: String,
    userId: String,
    userImage: String,
    userBioName: String,
    moderatedAt: {
        type: String,
        default: new Date()
    },
    storyName: {
        type: String,
        default: ""
    },
    stories: [{
        image: {
            resource_type: String,
            public_id: String,
            url: String
        },
        duration: {
            type: Number,
            default: 500
        },
        createdAt: {
            type: String,
            default: new Date()
        },
        seen: [{
            userId: String
        }]
    }]
})

module.exports = model('Story', storyChema);