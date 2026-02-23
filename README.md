# 🤖 AI Mock Interview Platform

## 🚀 Overview

AI Mock Interview Platform is an intelligent interview simulation system that conducts real-time mock interviews using AI. The platform analyzes a candidate’s resume, generates personalized interview questions based on experience, evaluates spoken or written answers, and provides structured feedback.

The system supports a **Bring Your Own API Key (BYOK)** model where users can use their own AI provider API keys (OpenAI, Gemini, Claude), allowing scalable and cost-efficient usage.

This project aims to simulate a real interviewer experience using:

* Resume-based question generation
* Voice or text answers
* AI-driven evaluation
* Performance feedback
* Interview analytics

---

## 🎯 Problem Statement

Candidates struggle to prepare for real interviews because:

* No personalized mock interview tools exist
* Generic question lists are ineffective
* Lack of feedback on communication and correctness
* No real-time interview simulation

This platform solves these problems using AI.

---

## ✨ Features

### 🧾 Resume-Based Interview Generation

* Upload resume (PDF/DOC)
* Extract skills, experience, and role
* AI generates personalized interview questions
* Dynamic difficulty adjustment based on experience level

---

### 🎤 Voice-Based Interview Simulation

* Record spoken answers
* Speech-to-text conversion
* Real-time answer processing
* Manual "Start / Stop Listening"

---

### 🧠 AI Answer Evaluation

* Technical correctness scoring
* Communication analysis
* Answer depth evaluation
* Improvement suggestions
* Structured feedback report

---

### 🔄 Interview Flow Controller

* One question at a time
* AI asks next question based on previous answer
* Adaptive questioning
* Interview session state management

---

### 📊 Performance Analytics

* Score per question
* Strength & weakness analysis
* Communication feedback
* Overall interview score

---

### 🔑 Bring Your Own API Key (BYOK)

* Users can use their own AI provider API key
* Supports:

  * OpenAI
  * Google Gemini
  * Anthropic Claude
* Secure key storage
* No AI cost for platform owner

---

### 💬 Text-Based Interview Mode (MVP)

* Type answers instead of speaking
* Faster processing
* Useful for low bandwidth environments

---

### 📁 Interview History

* Past interviews
* Feedback tracking
* Performance improvement over time

---

## 🏗 System Architecture

```
Frontend (React / Next.js)
        ↓
Backend API (Node / FastAPI)
        ↓
AI Services Layer
        ├── Resume Processing
        ├── Question Generator
        ├── Answer Evaluator
        └── Speech Processing
        ↓
Database (Postgres / MongoDB)
```

---

## ⚙️ Core Modules

### 1. Resume Processing Engine

* Parse PDF/DOC resume
* Extract:

  * skills
  * experience
  * job role
  * technologies
* Generate interview context

---

### 2. Interview Engine

* AI interviewer persona
* Generates questions
* Maintains interview context
* Adaptive questioning

---

### 3. Speech Processing Module

* Record audio
* Convert speech → text
* Send transcription to AI
* Generate feedback

---

### 4. Answer Evaluation Engine

Evaluates answers on:

* correctness
* clarity
* communication
* depth
* completeness

---

### 5. Interview State Machine

```
IDLE → LISTENING → PROCESSING → FEEDBACK → NEXT QUESTION
```

---

## 🧰 Tech Stack

### Frontend

* React / Next.js
* Web Speech API
* WebRTC (audio capture)
* Tailwind / Material UI

### Backend

* Node.js (Express) OR FastAPI
* REST APIs
* Session management

### AI & ML

* OpenAI / Gemini / Claude
* Prompt engineering
* Embeddings (optional)
* RAG (optional)

### Speech Recognition

* OpenAI Whisper
* Google Speech API
* Deepgram
* Browser Speech API (MVP)

### Database

* PostgreSQL OR MongoDB

### Storage

* AWS S3 / GCP Storage (resume files)

---

## 📡 API Design (High Level)

### Upload Resume

```
POST /api/resume/upload
```

### Start Interview

```
POST /api/interview/start
```

### Submit Answer

```
POST /api/interview/answer
```

### Get Feedback

```
GET /api/interview/result/:sessionId
```

---

## 🔐 API Key Management (BYOK Model)

Users can provide:

* OpenAI API key
* Gemini API key
* Claude API key

### Implementation

* Keys stored encrypted
* Used only for user requests
* Platform does not manage billing

---

## 📊 Database Schema (Basic)

### Users

* id
* email
* api_key_encrypted

### Resumes

* id
* user_id
* extracted_data

### Interviews

* id
* user_id
* session_state
* score

### Responses

* question
* answer
* evaluation
* score

---

## 🚀 Getting Started

### 1. Clone Repository

```
git clone <repo-url>
cd ai-mock-interview
```

### 2. Install Dependencies

```
npm install
```

### 3. Setup Environment Variables

```
PORT=4000
DATABASE_URL=
OPENAI_API_URL=
```

### 4. Run Server

```
npm run dev
```

---

## 🛠 MVP Development Plan

### Phase 1 (Week 1)

* Resume upload
* Question generation
* Text answer evaluation

### Phase 2

* Voice recording
* Speech-to-text

### Phase 3

* Interview flow controller
* Scoring system

### Phase 4

* Analytics dashboard
* Interview history

---

## 🔮 Future Improvements

* Video interview simulation
* Emotion detection
* Eye contact tracking
* AI interviewer avatar
* Real-time coaching tips
* Company-specific interview mode
* Coding interview mode
* System design interview mode

---

## 🎯 Target Users

* Software developers
* Job seekers
* Students
* Bootcamp learners
* Professionals preparing for interviews

---

## 📈 Potential Business Model

* Bring your own API key (default)
* Freemium usage tier
* Premium interview analytics
* Company-specific interview packages

---

## 🤝 Contribution

Contributions are welcome.

1. Fork repository
2. Create feature branch
3. Submit pull request

---


