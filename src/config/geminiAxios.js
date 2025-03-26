const axios = require("axios");
const qs = require("querystring");

const geminiClient = axios.create({
    baseURL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", // Replace with your external API base URL
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 5000,
});

geminiClient.interceptors.request.use(
    (config) => {
        config.params = {
            key: process.env.GEMINI_API_KEY, // Ensure it gets the latest value
            ...(config.params || {}) // Preserve existing params
        };
        const queryString = config.params ? `?${qs.stringify(config.params)}` : "";
        const fullUrl = `${config.baseURL}${config.url ? config.url : ''}${queryString}`;
        console.log(`Key = ${process.env.GEMINI_API_KEY}`)
        console.log(`🔗 Full Request URL: ${fullUrl}`);
        console.log(`📝 Request Method: ${config.method.toUpperCase()}`);
        console.log(`📩 Request Params:`, config.params);
        console.log(`📩 Request Data:`, config.data);
        console.log(`📄 Request Headers:`, config.headers);

        return config;
    },
    (error) => Promise.reject(error)
);

geminiClient.interceptors.response.use(
    (response) => {
        console.log(`✅ Response from: ${response.config.url}`);
        console.log(`📡 Response Data:`, response.data);
        return response;
    },
    (error) => {
        console.error("❌ Axios error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

module.exports = geminiClient;