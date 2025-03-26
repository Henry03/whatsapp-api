const whatsappService = require('../service/whatsappService');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post("/session", async (req, res) => {
  try {
    const {sessionId} = req.body;

    if(!sessionId){
      return res.status(400).json({message: "Session ID is required"});
    }

    await whatsappService.createClient(sessionId);
    res.status(200).json({ success: true, message: `WhatsApp client initializing for session ${sessionId}` });
  } catch (error){
    res.status(500).json({ success: false, error: error.message });
  }
})

router.get("/qr/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const qrPath = path.join(__dirname, `../../public/qrcodes/${sessionId}.png`);

  if (fs.existsSync(qrPath)) {
      res.sendFile(qrPath);
  } else {
      res.status(404).json({ error: "QR Code not found" });
  }
});

router.post("/send-message", async (req, res) => {
  const { sessionId, number, message } = req.body;

  if (!number || !message) {
      return res.status(400).json({ error: "Number and message are required" });
  }

  try {
      await whatsappService.sendMessage(sessionId, `${number}@c.us`, message);
      return res.json({ success: true, message: `Message sent to ${number}` });
  } catch (error) {
      console.error("❌ Error sending message:", error.message);
      return res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
