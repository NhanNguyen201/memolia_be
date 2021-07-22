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
                const updatedStory = await Story.findByIdAndUpdate(storyId, { moderatedAt, stories }, {new: true})
                return res.json(updatedStory);
            }).catch(error => {
                throw error
            })
        } else {
            return res.status(401).json({error: "No authority"})
        }
       
    } catch (error) {
        return res.json({error: "something wrong"})
    }
    
}
module.exports.commentStory = async(req, res) => {
    const { storyId, subStoryId } = req.params;
    const { body } = req.body;
    const { userId, userName, userBioName, userImage } = req.user;
    if(!mongoose.Types.ObjectId.isValid(storyId)) return res.status(404).json({error: "No story found"});
    try {
        const story = await Story.findById(storyId);
        const { stories } = story;
        if(story.userId == req.user.userId){
            const subStoryIndex = stories.findIndex(st => st._id == subStoryId)
            if(subStoryIndex > -1) {
                stories[subStoryIndex].comments.unshift({
                    body,
                    userBioName,
                    userId,
                    userName,
                    userImage,
                    createdAt: new Date().toISOString()
                })
                const updateStory = await Story.findByIdAndUpdate(storyId, { stories }, {new: true})
                return res.json(updateStory);
            } else return res.status(404).json({error: "No story found"})
        } else return res.status(401).json({error: "No authority"})
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something is wrong"})
    }
}

module.exports.getStory = async (req, res) => {
    const { storyId } = req.params;
    if(!mongoose.Types.ObjectId.isValid(storyId)) return res.status(404).json({error: "No story found"});
    try {
        const story = await Story.findById(storyId);
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

module.exports.deleteStory = async (req, res) => {
    const { storyId, subStoryId } = req.params;
    if(!mongoose.Types.ObjectId.isValid(storyId)) return res.status(404).json({error: "No story found"});
    try {
        const story = await Story.findById(storyId);
        if(story.userId == req.user.userId){
            const subStory = story.stories.find(st => st._id == subStoryId)
            if(subStory) {
                let stories = story.stories.filter(st => String(st._id) !== String(subStoryId))
                if(stories.length > 0){
                    let deletePromise = new Promise((resolve, reject) => {
                        cloudinary.uploader.destroy(subStory.image.public_id, (error, result) => {
                            if(error) { 
                                reject(error) 
                            } else resolve(result)
                        })
                    });
                    deletePromise.then(async() => {
                        const updateStory = await Story.findByIdAndUpdate(storyId, {stories: stories}, {new: true})
                        return res.json({
                            message: "Delete substory successfully",
                            story: updateStory
                        })
                    }).catch(error => {
                        throw error
                    })
                } else {
                    let deletePromise = new Promise((resolve, reject) => {
                        cloudinary.uploader.destroy(subStory.image.public_id, (error, result) => {
                            if(error) { 
                                reject(error) 
                            } else resolve(result)
                        })
                    });
                    deletePromise.then(async() => {
                        await Story.findByIdAndDelete(storyId)
                        return res.json({
                            message: "Delete story successfully",
                        })
                    }).catch(error => {
                        throw error
                    })
                }
            } else return res.status(404).json({error: "No story found"})
        } else return res.status(401).json({error: "No authority"})
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something is wrong"})
    }
}