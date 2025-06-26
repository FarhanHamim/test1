const express = require('express');
const router = express.Router();
const { createOrUpdateUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');
router.post('/create-or-update', createOrUpdateUser);
router.get('/profile', verifyToken, getUserProfile);
router.patch('/profile', verifyToken, updateUserProfile);

module.exports = router; 