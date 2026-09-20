const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parent.controller');
router.post('/register', parentController.register);
router.post('/login', parentController.login);
router.get('/:id/dashboard', parentController.dashboard);
module.exports = router;
