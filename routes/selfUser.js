const express = require('express');
const router = express.Router();
const { chkAuth } = require('../midlewares/chkAuth');

const { loginWithGoogle, getMyPosts, getNotifications } = require('../controllers/selfUser');

router.get('/', chkAuth, getMyPosts);
router.get('/loginWithGoogle', loginWithGoogle);
router.get('/notifications', getNotifications);
module.exports = router;