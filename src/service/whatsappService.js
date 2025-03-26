const qrcode = require("qrcode");
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const { sendMessageToGemini } = require("./geminiService");

const clients = new Map();

async function createClient(sessionId) {
    if (clients.has(sessionId)) {
        console.log(`⚠ Session ${sessionId} already exists`);
        return;
    }

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: `whatsapp/${sessionId}` }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        }
    });

    client.on('ready', () => {
        console.log(`✅ WhatsApp Client ${sessionId} is ready!`);

        const qrPath = path.join(__dirname, `../../public/qrcodes/${sessionId}.png`);
        
        if (fs.existsSync(qrPath)) {
            fs.unlink(qrPath, (err) => {
                if (err) console.error(`❌ Failed to delete QR Code for ${sessionId}:`, err);
                else console.log(`🗑️ Deleted QR Code for session ${sessionId}`);
            });
        }
    });

    client.on('qr', async (qr) => {
        console.log('📌 QR Code received, saving as PNG...');
        
        try {
            const qrPath = path.join(__dirname, `../../public/qrcodes/${sessionId}.png`);
            if (fs.existsSync(qrPath)) {
                fs.unlinkSync(qrPath);
            }
        
            await qrcode.toFile(qrPath, qr, { width: 300 });
            console.log('✅ QR Code saved as PNG.');
        } catch (error) {
            console.error('❌ Error saving QR Code:', error);
        }
    });

    client.on('message_create', async (message) => {
        try {
            if (message.body === '!ping') {
                await client.sendMessage(message.from, 'pong');
            } else if (message.body === '!exit') {
                console.log(`🔴 Exiting session: ${sessionName}`);
                await client.logout();
            } else if (message.body === '!restart') {
                console.log(`♻ Restarting session: ${sessionName}`);
                await restartClient(sessionName);
            } else if (message.body.toLowerCase().split(" ")[0] == "!ask"){
                const query = message.body.split(" ").slice(1).join(" ");
                const response = await sendMessageToGemini(query);
                await client.sendMessage(message.from, response);
            }
        } catch (error) {
            console.error(`❌ Error handling message in session ${sessionName}:`, error);
        }
    });

    client.on('disconnected', reason => {
        restartClient(reason)
    });

    client.on('change_state', state => {
        console.log(`📢 Client ${sessionName} state changed: ${state}`);
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
            restartClient(sessionName);
        }
    });

    client.on('auth_failure', message => {
        console.error(`❌ Authentication failure for session ${sessionName}:`, message);
        restartClient(sessionName);
    });

    client.initialize();

    clients.set(sessionId, client);
}

async function  restartClient(sessionId) {
    if(!sessionId){
        return "Session Id is required";
    }

    console.log(`♻ Restarting client...`);
    if (clients[sessionId]) {
        await clients[sessionId].logout();
        clients[sessionId] = null;
    }
    setTimeout(() => {
        console.log("🔄 Reinitializing WhatsApp client...");
        createClient();
    }, 5000);
}

async function sendMessage(session, number, message) {
    if (!clients.has(session)) {
        console.error(`❌ Session ${session} does not exist.`);
        throw new Error(`Session ${session} does not exist.`);
    }

    const client = clients.get(session);
    try {
        await client.sendMessage(number, message);
        console.log(`📩 Message sent to ${number} from session ${session}`);
    } catch (error) {
        console.error(`❌ Failed to send message:`, error);
    }
}

module.exports = {createClient, restartClient, sendMessage};