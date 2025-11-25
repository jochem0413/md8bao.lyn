const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

// Railway 會自動將環境變數注入這裡
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const PORT = process.env.PORT || 3000;
// 使用 gemini-2.0-flash-exp 或原本的 model，這裡建議保持原本變數，方便日後修改
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

const app = express();

// 中間件設置
app.use(express.json()); // 處理 POST 請求的 JSON body

// 1. 提供靜態檔案 (您的 HTML, CSS, JS)
app.use(express.static(path.join(__dirname))); 

// 2. 路由處理：前端呼叫 /api/generate 時，由這裡轉發給 Gemini
app.post('/api/generate', async (req, res) => {
    // 檢查金鑰是否已設置
    if (!GEMINI_API_KEY) {
        console.error("Server Error: GEMINI_API_KEY environment variable is not set.");
        return res.status(500).json({ error: 'Server configuration error: API Key missing.' });
    }
    
    // 接收前端傳來的完整 payload (包含 contents 和 systemInstruction)
    const clientPayload = req.body;
    
    try {
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // 修正：直接轉發整個 body，確保 systemInstruction 不會遺失
            body: JSON.stringify(clientPayload) 
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Gemini API Error:', data);
            return res.status(response.status).json({
                error: 'Gemini API Error',
                details: data.error || data
            });
        }
        
        // 成功，將 Gemini 的響應返回給前端
        res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Fetch Error:', error);
        res.status(500).json({ error: 'Internal Server Error during AI request.' });
    }
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});