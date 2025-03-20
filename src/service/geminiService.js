const geminiClient = require('../config/geminiAxios');
const fs = require("fs");
const path = require("path");

const historyFilePath = path.join(__dirname, "../../baileys_auth_info/conversationHistory.json");

function loadConversationHistory() {
    try {
        if (fs.existsSync(historyFilePath)) {
            const data = fs.readFileSync(historyFilePath, "utf8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error loading conversation history:", error);
    }
    return []; // Return empty array if file doesn't exist or fails to load
}

function saveConversationHistory(history) {
    try {
        fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), "utf8");
    } catch (error) {
        console.error("Error saving conversation history:", error);
    }
}

let conversationHistory = loadConversationHistory();

async function sendMessageToGemini(query) {
    conversationHistory.push({ role: "user", parts: [{ text: query }] });

    const requestBody = {
        contents: conversationHistory
    };

    try {
        const response = await geminiClient.post("", requestBody);
        
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        
        conversationHistory.push({ role: "model", parts: [{ text: aiResponse }] });

        saveConversationHistory(conversationHistory);

        return aiResponse;
    } catch (error) {
        console.error("Error sending request to Gemini:", error.response?.data || error.message);
        return "Sorry, an error occurred while processing your request.";
    }
}

module.exports = { sendMessageToGemini };