const { model, Schema } = require('mongoose');


const postSchema = new Schema({
    title: String,
    message: String,
    userName: String,
    userId: String,
    userImage: String,
    userBioName: String,
    tags: [String],
    selectedFiles: [
        {
            resource_type: String,
            public_id: String,
            url: String
        }
    ],
    isPrivate: {
        type: Boolean,
        default: false
    },
    privateAccess: [
        {
            userId: String,
            userName: String
        }
    ],
    reactions: [
        {
            emoji: String,
            userId: String,
            userName: String,
            userBioName: String,
            userImage: String,
        }
    ],
    commentCount: {
        type: Number,
        default: 0
    },
    comments: [
        {
            userId: String,
            userName: String,
            userBioName: String,
            userImage: String,
            body: String,
            createdAt: String,
            replyCount: {
                type: Number,
                default: 0
            },
            reactions: [
                {
                    emoji: String,
                    userId: String,
                    userName: String,
                    userBioName: String,
                    userImage: String,
                }
            ],
            replies: [
                {
                    userId: String,
                    userName: String,
                    userBioName: String,
                    userImage: String,
                    body: String,
                    createdAt: String
                }
            ]
        }
    ],
    createdAt: {
        type: String,
        default: new Date()
    }
})

module.exports = model('Post', postSchema);