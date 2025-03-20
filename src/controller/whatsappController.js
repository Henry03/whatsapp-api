const whatsappService = require('../service/whatsappService');
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.post('/', async (req, res) => {
    try {
        const { number, message } = req.body;
        if (!number || !message) {
            return res.status(400).json({ error: 'Number and message are required' });
        }

        const result = await whatsappService.sendMessage(number, message);
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.post("/send-message", async (req, res) => {
    const { jid, userId, message } = req.body;
    if (!jid || !message) {
      return res.status(400).json({ error: "jid and message are required" });
    }
  
    try {
      await whatsappService.sendMessage(userId, jid, message)
      res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.post('/session/init', async (req, res) => {
    try {
        const { userId } = req.body; // Get user ID from request
        await whatsappService.getClient(userId);
        res.status(200).json({ success: true, message: `WhatsApp client initializing for user ${userId}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get("/qr/:userId", (req, res) => {
  const { userId } = req.params;
  console.log(userId)
  const qrPath = path.join(__dirname, `../../public/qrcodes/${userId}.png`);

  if (fs.existsSync(qrPath)) {
      res.sendFile(qrPath);
  } else {
      res.status(404).json({ error: "QR Code not found" });
  }
});

module.exports = router;