const Story = require('../models/stories')
const { cloudinary } = require('../utils/cloundinary')

module.exports.createStory = async (req, res) => {
    const { storyName, storyImage, duration } = req.body;
    const { userName, userBioName, userImage, userId } = req.user;
    let uploadPromise = new Promise((resolve, reject) => {
        cloudinary.uploader.upload(storyImage, { upload_preset: 'dev_Nhan', resource_type: "auto"}, function (error, result) {
            if(error) reject(error)
            else resolve({
                resource_type: result.resource_type,
                public_id: result.public_id,
                url: result.url
            })
        })
    })
    uploadPromise.then(async result => {    
        let newStory = new Story({
            userName,
            userId,
            userImage,
            userBioName,
            storyName,
            moderatedAt: new Date().toISOString(),
            stories: [{
                image: {
                    resource_type: result.resource_type,
                    public_id: result.public_id,
                    url: result.url
                },
                duration: duration,
                createdAt: new Date().toISOString()
            }]
        })
        await newStory.save()
        return res.json(newStory);
    }).catch(err => {
        console.log(err);
        return res.status(500).json({error: "Something is wrong"})
    })
}

module.exports.addToStory = (req, res) => {

}