const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'user-service' });
});

// Users schema operations
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-ai-key';

// Real Signup
app.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0]
            }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ user, token });
    } catch (error) {
        console.error("Signup error:", error);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        res.status(500).json({ error: 'Internal server error during signup', details: error.message });
    }
});

// Real Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update API Key (BYOK)
app.post('/:id/apikey', async (req, res) => {
    try {
        const { id } = req.params;
        const { apiKey } = req.body;
        const user = await prisma.user.update({
            where: { id },
            data: { api_key_encrypted: apiKey } // Should be encrypted in production
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update API key' });
    }
});

app.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
});

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`);
});
