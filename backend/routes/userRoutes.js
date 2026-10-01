const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUserStatus, updateUserRole } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

router.use(protect, adminOnly);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id/status', updateUserStatus);
router.put('/:id/role', updateUserRole);

module.exports = router;
