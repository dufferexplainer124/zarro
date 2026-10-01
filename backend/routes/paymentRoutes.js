const express = require('express');
const router = express.Router();
const { initiate, verify, getByOrder } = require('../controllers/paymentController');
const protect = require('../middleware/authMiddleware');

router.use(protect);
router.post('/initiate', initiate);
router.post('/verify', verify);
router.get('/order/:orderId', getByOrder);

module.exports = router;
