const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators/validationRules');

router.post('/register', registerRules, register);
router.post('/login', loginRules, login);

module.exports = router;
