const express = require('express');
const router = express.Router();
const {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getCreatedGroups,
  getJoinedGroups
} = require('../controllers/groupController');
const verifyToken = require('../middleware/verifyToken');

// Protected routes (authentication required)
router.get('/user/created', verifyToken, getCreatedGroups);
router.get('/user/joined', verifyToken, getJoinedGroups);
router.post('/', verifyToken, createGroup);

// Public routes
router.get('/', getAllGroups);

// Protected parameterized routes
router.get('/:id', getGroupById);
router.patch('/:id', verifyToken, updateGroup);
router.delete('/:id', verifyToken, deleteGroup);
router.post('/:id/join', verifyToken, joinGroup);
router.post('/:id/leave', verifyToken, leaveGroup);

module.exports = router;