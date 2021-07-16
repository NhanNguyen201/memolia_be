const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const cors = require('cors');

const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const searchRoute = require('./routes/search');
const selfRoute = require('./routes/selfUser');
const storyRoute = require('./routes/stories')

const app = express();

dotenv.config()

app.use(cors({
    origin: true
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Header', "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(helmet());

app.use(bodyParser.json({limit: "30mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));


app.get('/', (req, res) => res.send("Hello"));

app.use('/posts', postRoutes);
app.use('/search', searchRoute);
app.use('/users', userRoutes);
app.use('/user', selfRoute);
app.use('/stories', storyRoute)

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.CONNECT_URL, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log('mongoDB connect');
        return app.listen(PORT, () => console.log(`Server runing at ${PORT}`))
    })
    .catch(err => console.log(err))

mongoose.set('useFindAndModify', false);
