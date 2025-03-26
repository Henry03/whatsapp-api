const makeWASocket = require("@whiskeysockets/baileys").default;
const { DisconnectReason, useMultiFileAuthState, makeInMemoryStore } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const fs = require('fs');
const path = require('path');
const { sendMessageToGemini } = require("./geminiService");
const qrcode = require("qrcode");

const clients = {}; 
const store = makeInMemoryStore({});

async function createWhatsAppClient(userId) {
    const sessionPath = path.join(__dirname, `../../baileys_auth_info/${userId}`);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        markOnlineOnConnect: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("Scan this QR Code:", qr);

            // Generate QR code image and store it
            const qrPath = path.join(__dirname, `../../public/qrcodes/${userId}.png`);
            if (fs.existsSync(qrPath)) {
                fs.unlinkSync(qrPath);
            }
        
            // Generate QR Code baru
            await qrcode.toFile(qrPath, qr, { width: 300 });
            clients[userId] = { sock, qrPath };
        }

        if (connection === "close") {
            const errorCode = lastDisconnect?.error?.output?.statusCode;
            console.log("Connection closed due to:", lastDisconnect?.error);

            if (errorCode === 401 || lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                console.log("Logged out, clearing session and regenerating QR...");

                // Delete auth folder to force new login
                console.log(sessionPath)
                fs.rmSync(sessionPath, { recursive: true, force: true });

                // Reconnect and regenerate QR
                createWhatsAppClient(userId);
            } else {
                const shouldReconnect = errorCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    createWhatsAppClient(userId);
                }
            }
        } else if (connection === "open") {
            console.log("WhatsApp connection opened");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        const message = m.messages[0]; 
        const remoteJid = message.key.remoteJid;
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        console.log(sessionPath)
        console.log("message : ", text)
        if (remoteJid && text?.toLowerCase() === "!ping") {
            await sock.sendMessage(remoteJid, { text: "pong" });
            console.log(`Replied with "pong" to ${remoteJid}`);
        }
        if(remoteJid && text?.toLowerCase().split(" ")[0] === "!ask"){
            const query = text.split(" ").slice(1).join(" ");
            const response = await sendMessageToGemini(query);

            await sock.sendMessage(remoteJid, { text: response });
        }
    });

    store.bind(sock.ev);

    // Listen for new or updated contacts
    sock.ev.on("contacts.upsert", (contacts) => {
      console.log("New contacts added/updated:", contacts);
    });
  
    // Function to get all old and new contacts

  
    // Wait for contacts to load, then print all contacts
    setTimeout(() => {
      console.log("All contacts:", getAllContacts());
    }, 5000);
  
    sock.ev.on("creds.update", saveCreds);

    clients[userId] = sock;
}

function getAllContacts(sessionId) {
    return Object.values(store.contacts); // Retrieves all stored contacts
  }

async function getClient(userId) {
    console.log("test" + userId)
    if (clients[userId]) {
        console.log(`Client for ${userId} already exists.`);
        return clients[userId];
    }

    return createWhatsAppClient(userId);
}

async function sendMessage(userId, jid, message) {
    if (!clients[userId]) {
        throw new Error(`WhatsApp session for ${userId} is not connected`);
    }
    await clients[userId].sendMessage(jid, { text: message });
}

async function getContacts(sessionId) {
    if (!clients[sessionId]) {
        throw new Error(`WhatsApp session for ${sessionId} is not connected`);
    }
    await clients[sessionId].fetchContacts();
}

module.exports = { getClient, sendMessage, getAllContacts };
