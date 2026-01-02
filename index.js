
require('dotenv').config(); 
const express = require('express');
const axios = require('axios');


const app = express();
app.use(express.json()); 

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;


// model list ko reliable se connect kiya taki switch kre
const freeModels = [
    'mistralai/mistral-7b-instruct:free',
    'nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free',
    'huggingfaceh4/zephyr-7b-beta:free',
    'google/gemma-7b-it:free',
];


app.post('/api/generate', async (req, res) => {
   
    const { classLevel, subject, board, language, userPrompt } = req.body;


    if (!userPrompt || !classLevel || !subject || !board || !language) {
        return res.status(400).json({ error: "Missing required fields in request." });
    }

    // AI ke liye detailed "Instructions" banayega
    const fullPrompt = `
      You are 'ShikshaSarathi AI', an expert teaching assistant for teachers in India.
      A teacher has provided the following context:
      - Class: ${classLevel}
      - Subject: ${subject}
      - Board: ${board}
      - Preferred Language for Response: ${language}
      
      Now, fulfill the teacher's following request. IMPORTANT: Respond ONLY in their preferred language.

      THEIR REQUEST IS: "${userPrompt}"
    `;

    // Ek-ek karke har free model ko try kara
    for (const model of freeModels) {
        try {
            console.log(`Trying model: ${model}`);
            
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: model,
                    messages: [
                        { role: "user", content: fullPrompt }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json', 
                        'HTTP-Referer': 'https://shiksha-sarthi.com',
                        'X-Title': 'Shiksha Sarthi AI',
                    }
                }
            );

            const aiResponse = response.data.choices[0].message.content;
            return res.status(200).json({ response: aiResponse });

        } catch (error) {
            console.error(`Error with model ${model}:`, error.response ? error.response.data : error.message);
        }
    }

    return res.status(500).json({ error: "All AI models failed to respond. Please try again later." });
});

// Server ko start kiya
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ShikshaSarthi LLM service is running on port ${PORT}`);
});

