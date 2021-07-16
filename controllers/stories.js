const Story = require('../models/stories')
const mongoose = require('mongoose');
const { cloudinary } = require('../utils/cloundinary')

module.exports.createStory = async (req, res) => {
    const { storyName, storyImage, duration } = req.body;
    const { userName, userBioName, userImage, userId } = req.user;
    try {
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
        uploadPromise
            .then(async result => {    
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
            })
            .catch(err => {
                console.log(err);
                return res.status(500).json({error: "Something is wrong"})       
            })
    } catch (error) {
        console.log(err);
        return res.status(500).json({error: "Something is wrong"})
    }
   
}

module.exports.addToStory = async (req, res) => {
    const { storyImage, duration } = req.body;
    const { userId } = req.user;
    const { storyId } = req.params;
    if(!mongoose.Types.ObjectId.isValid(storyId)) return res.status(404).json({error: "No story found"});
    try {
        const story = await Story.findById(storyId);
        if(story.userId === userId){
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
                let { moderatedAt, stories } = story;
                moderatedAt = new Date().toISOString();
                stories.push({
                    image: {
                        resource_type: result.resource_type,
                        public_id: result.public_id,
                        url: result.url
                    },
                    duration: duration,
                    createdAt: new Date().toISOString()
                })
                const updatedStory = await Story.findByIdAndUpdate(storyId, { moderatedAt, stories })
                return res.json(updatedStory);
            })
        } else {
            return res.json({error: "No authority"})
        }
       
    } catch (error) {
        return res.json({error: "something wrong"})
    }
    
}

module.exports.getStory = async (req, res) => {
    const { storyId } = req.params;
    if(!mongoose.Types.ObjectId.isValid(storyId)) return res.status(404).json({error: "No story found"});
    try {
        const story = Story.findById(storyId);
        if(story){
            return res.json(story)
        } else {
            return res.status(404).json({error: "No story found"})
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something is wrong"})
    }
}