const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const { optionalToken } = require('../middleware/authMiddleware');

router.get('/', optionalToken, recommendationController.getRecommendations);

module.exports = router;
