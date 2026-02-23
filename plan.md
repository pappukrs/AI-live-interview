Build a full production-ready AI Mock Interview Platform web application.

This platform should simulate real technical interviews using AI, analyze user responses, and provide feedback based on resume, experience level, and answers.

Build complete frontend + backend + database + APIs + UI.

Follow modern production architecture.

---

# PRODUCT NAME
AI Mock Interview Platform

---

# PRODUCT GOAL

Create an intelligent interview simulator where:

- User uploads resume
- AI analyzes resume
- AI generates interview questions based on experience
- User answers via voice or text
- AI evaluates answers
- AI asks next question
- User receives performance report

System should behave like a real interviewer.

---

# CORE FEATURES

## 1. Authentication
- Signup/Login (email + password)
- JWT authentication
- Session management
- User dashboard

---

## 2. Resume Upload + Parsing
- Upload PDF/DOC resume
- Extract:
  - skills
  - experience years
  - role
  - technologies
  - projects
- Store structured profile
- Use AI to structure resume data

Example extracted data:
{
  "skills": ["React", "Node", "Spring Boot"],
  "experience": "3 years",
  "role": "Full Stack Developer"
}

---

## 3. AI Interview Engine

System must:

- Generate personalized questions
- Adjust difficulty based on experience
- Ask one question at a time
- Maintain interview context
- Ask follow-up questions
- Avoid repeating questions

AI interviewer prompt behavior:

"You are a strict senior technical interviewer conducting a real interview."

---

## 4. Interview Session Flow

State machine based:

IDLE → QUESTION → LISTENING → PROCESSING → FEEDBACK → NEXT QUESTION → COMPLETED

Interview flow:

1. Start interview
2. AI generates question
3. User answers
4. AI evaluates answer
5. AI generates next question
6. Final report generated

---

## 5. Voice-Based Interview

- Start listening button
- Stop listening button
- Record microphone audio
- Convert speech to text
- Send transcript to backend
- Show transcript to user

Use browser speech API or whisper API.

---

## 6. Text Answer Mode (MVP)
- User can type answers
- Send to AI for evaluation

---

## 7. AI Answer Evaluation

AI must evaluate answer based on:

- correctness
- clarity
- communication
- depth
- confidence
- completeness

Return structured JSON:

{
  score: 1-10,
  feedback: "",
  improvement: "",
  strengths: []
}

---

## 8. Performance Report

- overall score
- per question score
- strengths
- weaknesses
- improvement tips

---

## 9. Interview History
- store past sessions
- view feedback
- track progress

---

## 10. Bring Your Own API Key (BYOK)

User settings page:

- add OpenAI key
- add Gemini key
- add Claude key

System should use user's key when calling AI.

Store encrypted.

---

# FRONTEND REQUIREMENTS

Use:

- Next.js (React)
- Tailwind UI
- Clean modern UI
- Responsive design

Pages required:

- login
- signup
- dashboard
- resume upload
- interview screen
- feedback screen
- settings page
- history page

Interview UI:

- question display
- start/stop recording button
- transcript display
- next question
- feedback panel

---

# BACKEND REQUIREMENTS

Use:

- Node.js + Express 
- REST APIs
- MVC architecture
- Modular services

Modules:

- auth service
- resume service
- interview service
- AI service
- speech service
- evaluation service

---

# DATABASE DESIGN

Use PostgreSQL 

Tables/collections:

Users:
- id
- email
- password
- api_key_encrypted

Resumes:
- id
- user_id
- extracted_data

Interviews:
- id
- user_id
- status
- score

Responses:
- interview_id
- question
- answer
- evaluation
- score

---

# API ENDPOINTS

POST /auth/signup
POST /auth/login
POST /resume/upload
POST /interview/start
POST /interview/answer
GET /interview/result
GET /interview/history
POST /settings/api-key

---

# AI PROMPT DESIGN

## Question Generator Prompt
"You are a senior technical interviewer. Candidate has {experience} experience with {skills}. Ask one interview question."

## Answer Evaluation Prompt
"Evaluate this answer strictly. Return score, feedback, and improvements."

---

# SYSTEM ARCHITECTURE

Frontend → Backend API → AI Service → Database

AI Service handles:
- question generation
- evaluation
- resume extraction

---

# SECURITY

- encrypt API keys
- validate file uploads
- JWT authentication
- rate limiting

---

# OPTIONAL ADVANCED FEATURES

- adaptive difficulty
- coding interview mode
- system design interview mode
- video interview support
- emotion detection
- analytics dashboard

---

# OUTPUT REQUIRED

Generate:

- full frontend code
- backend server
- database models
- API routes
- UI components
- interview flow logic
- speech recording integration
- AI integration logic
- project folder structure
- environment configuration
- setup instructions

Use production best practices.
