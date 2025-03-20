const axios = require("axios");

const geminiClient = axios.create({
    baseURL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", // Replace with your external API base URL
    headers: {
        "Content-Type": "application/json"
    },
    params: {
        key: process.env.GEMINI_API_KEY
    },
    timeout: 5000,
});

geminiClient.interceptors.request.use(
    (config) => {
        console.log(`Request made to: ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

geminiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("Axios error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

module.exports = geminiClient;