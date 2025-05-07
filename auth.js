// routes/auth.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authController = require('../controllers/authController');
const { linkTeenToParent } = require('../controllers/authController');

router.get('/', (req, res) => {
  res.send('✔️ auth route working');
});

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/profile/:role', authenticate, authController.getProfile);
router.post('/link-teen', authenticate, linkTeenToParent);

module.exports = router;



