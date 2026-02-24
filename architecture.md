# AI Mock Interview Platform Architecture

This document outlines the system architecture and operating flow of the AI Mock Interview Platform.

## 🏗 High-Level System Architecture

The application is built using a modern, scalable tech stack, integrating AI services natively to provide a seamless interview simulation experience.

```mermaid
graph TD
    A[Frontend (React / Next.js)] -->|REST API| B[Backend API (Node.js / Express)]
    
    B --> C{AI Services Layer}
    C -->|Extract Skills & Experience| D[Resume Processing Engine]
    C -->|Adaptive Questioning| E[Interview Engine]
    C -->|Speech-to-Text| F[Speech Processing Module]
    C -->|Score & Feedback| G[Answer Evaluation Engine]
    
    B -->|Read/Write User Data, Resumes, Scores| H[(Database: Postgres / MongoDB)]
    B -->|Store Resumes| I[Cloud Storage: AWS S3 / GCP Storage]
```

## ⚙️ Core Modules & How They Work

### 1. Frontend (Client-Side)
- **Tech Stack:** React, Next.js, Tailwind CSS.
- **Role:** Provides the user interface for candidates to upload resumes, manage their API keys, take mock interviews, and review performance analytics.
- **Key Features:** Uses Web Speech API & WebRTC for audio capture during voice-based simulations.

### 2. Backend API (Server-Side)
- **Tech Stack:** Node.js, Express.
- **Role:** Handles core business logic, session management, and acts as a secure intermediary between the frontend, database, and AI providers.
- **Key Features:** RESTful API design (`/api/resume/upload`, `/api/interview/start`, etc.) and encrypted API Key Management (BYOK model).

### 3. AI Services Layer (The "Brain")
This layer leverages external AI models (like OpenAI, Google Gemini, Anthropic Claude) through the user's provided API keys (BYOK - Bring Your Own Key). It is divided into four main engines:

- **Resume Processing Engine:** Parses uploaded PDF/DOC resumes to extract skills, experience, and job roles. This generates the initial context for the interview.
- **Interview Engine (Question Generator):** Acts as the AI interviewer persona. It generates dynamic, personalized questions based on the candidate's extracted resume context and prior answers.
- **Speech Processing Module:** Records candidate audio from the frontend, converts speech to text (using Whisper, Google Speech API, or Deepgram), and sends the transcription for AI evaluation.
- **Answer Evaluation Engine:** Evaluates candidate responses (both text and voice-transcribed) on criteria such as technical correctness, clarity, communication style, depth, and completeness.

### 4. Database & Storage Layer
- **Database:** PostgreSQL or MongoDB. Stores User Profiles (with encrypted BYOK API keys), Parsed Resume Data, Interview Session States, and Response Reports/Scores.
- **Storage:** AWS S3 or GCP Storage. Used for storing the raw uploaded resume files securely.

---

## 🔄 Interview Operating Flow (How it Works)

The interview process follows a strict State Machine to ensure a smooth, conversational flow:
`IDLE → LISTENING → PROCESSING → FEEDBACK → NEXT QUESTION`

1. **Setup & Context Gathering:**
   - The user inputs their AI Provider API Key (BYOK) securely.
   - The user uploads their resume.
   - The Backend parses the resume, extracts key technical skills and experience levels, and stores this context in the Database.

2. **Starting the Interview Session:**
   - The AI generates the first question tailored specifically to the user's experience.
   - The Frontend displays the question (and optionally speaks it out loud).
   - The State Machine transitions from `IDLE` to `LISTENING`.

3. **Capturing the Response:**
   - The user answers via Voice (processed via WebRTC/Browser Speech API) or Text (MVP Mode).
   - Once submitted, the State transitions to `PROCESSING`.

4. **AI Evaluation & Feedback Engine:**
   - The transcribed text or direct text input is sent to the Answer Evaluation Engine.
   - The AI model evaluates the answer on correctness, communication, and depth.
   - The response and evaluation score are saved to the Database.

5. **Adaptive Questioning:**
   - Based on the quality of the previous answer, the Interview Engine generates the next question (adjusting difficulty dynamically).
   - The system transitions to `NEXT QUESTION` and repeats the process until the session is complete.

6. **Post-Interview Analytics:**
   - Upon completion, the candidate receives a detailed Performance Report outlining strengths, weaknesses, communication feedback, and an overall interview score.
