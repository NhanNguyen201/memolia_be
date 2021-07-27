const express = require('express');
const router = express.Router();
const { chkAuth } = require('../midlewares/chkAuth');

const { loginWithGoogle, getMyPosts } = require('../controllers/selfUser');

router.get('/', chkAuth, getMyPosts);
router.get('/loginWithGoogle', loginWithGoogle);
module.exports = router;