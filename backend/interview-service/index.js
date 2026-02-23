const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { GoogleGenAI } = require('@google/genai');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('redis');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4003;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Redis setup
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch(console.error);

async function getAIResponse(provider, apiKey, systemPrompt, userPrompt) {
    if (provider === 'openai') {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        });
        return response.choices[0].message.content;
    } else if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
            }
        });
        return response.text;
    } else if (provider === 'claude') {
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }]
        });
        return response.content[0].text;
    }
    throw new Error('Unsupported AI provider');
}

app.post('/start', async (req, res) => {
    try {
        const { extractedData, provider = 'gemini', apiKey, userId = 'default-user' } = req.body;

        if (!apiKey) return res.status(401).json({ error: 'API Key missing' });

        const systemPrompt = `You are an expert technical interviewer. You will be provided with a candidate's resume data. Generate ONE personalized technical interview question to start the interview. Keep it concise.`;
        const userPrompt = `Resume Information: \n${JSON.stringify(extractedData)}`;

        const question = await getAIResponse(provider, apiKey, systemPrompt, userPrompt);

        // Create interview record in DB
        const interview = await prisma.interview.create({
            data: {
                userId,
                role: extractedData.role || 'Software Engineer',
                status: 'in-progress'
            }
        });

        const sessionId = interview.id;
        const sessionData = { history: [{ role: 'assistant', content: question }] };

        await redisClient.set(`session:${sessionId}`, JSON.stringify(sessionData), {
            EX: 3600 // Expire in 1 hour
        });

        // Store the first question in Responses too
        await prisma.response.create({
            data: {
                interviewId: sessionId,
                question: question
            }
        });

        res.json({ sessionId, question });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start interview' });
    }
});

app.post('/answer', async (req, res) => {
    try {
        const { sessionId, answer, provider = 'gemini', apiKey } = req.body;

        if (!apiKey) return res.status(401).json({ error: 'API Key missing' });

        const sessionRaw = await redisClient.get(`session:${sessionId}`);
        if (!sessionRaw) return res.status(404).json({ error: 'Session not found' });

        const session = JSON.parse(sessionRaw);
        const lastQuestion = session.history[session.history.length - 1].content;

        const systemPrompt = `You are an expert technical interviewer. Evaluate the candidate's answer to the provided question. 
Provide your response in JSON format with two keys:
1. "feedback": string (Feedback on their answer including correctness and improvement)
2. "nextQuestion": string (The next interview question based on their answer)
3. "score": number (Score between 1 and 10)
4. "strengths": array of strings
Do not include any markdown block formatting in your output, just plain JSON text.`;
        const userPrompt = `Question: ${lastQuestion}\nAnswer: ${answer}`;

        const rawResponse = await getAIResponse(provider, apiKey, systemPrompt, userPrompt);

        let parsed;
        try {
            parsed = JSON.parse(rawResponse.trim());
        } catch (e) {
            try {
                parsed = JSON.parse(rawResponse.replace(/```json/gi, '').replace(/```/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim());
            } catch (e2) {
                parsed = { feedback: "Could not parse feedback", nextQuestion: "Tell me more.", score: 5, strengths: [] };
            }
        }

        session.history.push({ role: 'user', content: answer });
        session.history.push({ role: 'assistant', content: parsed.nextQuestion });

        // Save updated session to Redis
        await redisClient.set(`session:${sessionId}`, JSON.stringify(session), {
            EX: 3600
        });

        // Record response in DB
        await prisma.response.create({
            data: {
                interviewId: sessionId,
                question: lastQuestion,
                answer: answer,
                evaluation: parsed,
                score: parsed.score
            }
        });

        // Store next question 
        await prisma.response.create({
            data: {
                interviewId: sessionId,
                question: parsed.nextQuestion
            }
        });

        res.json(parsed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process answer' });
    }
});

app.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const interviews = await prisma.interview.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { responses: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(interviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const interview = await prisma.interview.findUnique({
            where: { id: sessionId },
            include: { responses: true }
        });
        if (!interview) return res.status(404).json({ error: 'Session not found' });
        res.json(interview);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'interview-service' });
});

app.listen(PORT, () => {
    console.log(`Interview Service is running on port ${PORT}`);
});
