const express = require('express');
const router = express.Router();

const whatsappController = require('./whatsappController');

router.use('/whatsapp', whatsappController);

module.exports = router;


