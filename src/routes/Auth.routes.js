const express = require('express');
const router = express.Router();

const authControllers = require('../controllers/Auth.controllers');
const authMiddlewares = require('../middlewares/Auth.middlewares');

router.post('/getUser', authMiddlewares.authenticateToken, authMiddlewares.authenticateRoles("user"), authControllers.getUser);
router.post('/refreshToken', authControllers.refreshTokens);

router.post('/register', authControllers.register);
router.post('/login', authControllers.login);
router.post('/logout', authControllers.logout);

module.exports = router;