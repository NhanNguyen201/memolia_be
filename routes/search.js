const express = require('express');
const router = express.Router();

const { allSearch } = require('../controllers/search');

router.get('/search', allSearch)

module.exports = router;