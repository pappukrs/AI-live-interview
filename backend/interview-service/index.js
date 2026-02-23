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

        const systemPrompt = `You are a strict senior technical interviewer. You will conduct a professional technical interview. 
Based on the candidate's resume (Role: ${extractedData.role}, Experience: ${extractedData.experience}), generate ONE challenging technical interview question to start the interview. 
Adjust the difficulty and depth based on their experience level. Keep the question concise and professional.`;
        const userPrompt = `Candidate Resume Data: ${JSON.stringify(extractedData)}`;

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
        const sessionData = {
            history: [{ role: 'assistant', content: question }],
            meta: extractedData
        };

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

        const systemPrompt = `You are a strict senior technical interviewer. Evaluate the candidate's answer to your previous question based on:
- Correctness
- Clarity
- Communication
- Depth
- Confidence
- Completeness

Maintain the interview flow. If the candidate's answer is good, you can dive deeper or move to a new topic. If it's poor, give critical feedback.
The candidate's role is ${session.meta?.role} with ${session.meta?.experience} of experience.

Provide your response in JSON format with these exact keys:
1. "feedback": string (Concise, professional feedback)
2. "nextQuestion": string (The next technical question or follow-up)
3. "score": number (Integer between 1 and 10 based on the quality of their answer)
4. "strengths": array of strings
5. "improvement": string (How they can do better)

Return ONLY the JSON object. No markdown, no extra text.`;

        // Format history for AI
        const historyContext = session.history.map(h => `${h.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${h.content}`).join('\n');
        const userPrompt = `Interview History so far:\n${historyContext}\n\nCandidate's Last Answer: ${answer}\n\nEvaluate and provide the next question.`;

        const rawResponse = await getAIResponse(provider, apiKey, systemPrompt, userPrompt);

        let parsed;
        try {
            parsed = JSON.parse(rawResponse.trim());
        } catch (e) {
            try {
                parsed = JSON.parse(rawResponse.replace(/```json/gi, '').replace(/```/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim());
            } catch (e2) {
                parsed = { feedback: "Could not parse feedback", nextQuestion: "Tell me more about your experience.", score: 5, strengths: [], improvement: "Provide more details." };
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
