export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface ResumeData {
  skills: string[];
  experience: string;
  role: string;
  technologies: string[];
  projects: string[];
}

export interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  improvement?: string;
  strengths: string[];
  nextQuestion?: string;
}

export interface InterviewSession {
  id: string;
  date: string;
  role: string;
  status: "completed" | "in-progress" | "abandoned";
  score: number;
  questionsAnswered: number;
  totalQuestions: number;
  duration: string;
  questions: {
    question: string;
    answer: string;
    evaluation: AnswerEvaluation;
  }[];
}

export type InterviewState = "idle" | "question" | "listening" | "processing" | "feedback" | "completed";

export const mockUser: UserProfile = {
  id: "1",
  email: "john@example.com",
  name: "John Doe",
};

export const mockResume: ResumeData = {
  skills: ["React", "TypeScript", "Node.js", "Python", "PostgreSQL", "AWS"],
  experience: "3 years",
  role: "Full Stack Developer",
  technologies: ["Next.js", "Express", "Docker", "Redis", "GraphQL"],
  projects: ["E-commerce Platform", "Real-time Chat App", "CI/CD Pipeline"],
};

export const mockQuestions: InterviewQuestion[] = [
  { id: 1, question: "Can you explain the difference between useMemo and useCallback in React? When would you use each?", category: "React", difficulty: "medium" },
  { id: 2, question: "How would you design a scalable REST API for an e-commerce platform? Walk me through the key decisions.", category: "System Design", difficulty: "hard" },
  { id: 3, question: "Explain the event loop in Node.js. How does it handle asynchronous operations?", category: "Node.js", difficulty: "medium" },
  { id: 4, question: "What are the SOLID principles? Can you give an example of the Dependency Inversion Principle?", category: "Design Patterns", difficulty: "medium" },
  { id: 5, question: "How do you optimize a slow SQL query? What tools and techniques do you use?", category: "Database", difficulty: "hard" },
];

export const mockEvaluation: AnswerEvaluation = {
  score: 7,
  feedback: "Good understanding of the core concept. You correctly identified the memoization purpose but could elaborate more on the referential equality aspect.",
  improvement: "Try to include concrete examples and mention edge cases where these hooks might cause performance issues if misused.",
  strengths: ["Clear explanation", "Correct fundamentals", "Good communication"],
};

export const mockHistory: InterviewSession[] = [
  {
    id: "1", date: "2026-02-20", role: "Full Stack Developer", status: "completed",
    score: 78, questionsAnswered: 5, totalQuestions: 5, duration: "32 min",
    questions: mockQuestions.map((q) => ({
      question: q.question, answer: "Sample answer provided during interview.",
      evaluation: { ...mockEvaluation, score: Math.floor(Math.random() * 4) + 6 },
    })),
  },
  {
    id: "2", date: "2026-02-18", role: "Frontend Engineer", status: "completed",
    score: 85, questionsAnswered: 5, totalQuestions: 5, duration: "28 min",
    questions: mockQuestions.slice(0, 3).map((q) => ({
      question: q.question, answer: "Sample answer provided during interview.",
      evaluation: { ...mockEvaluation, score: Math.floor(Math.random() * 3) + 7 },
    })),
  },
  {
    id: "3", date: "2026-02-15", role: "Backend Developer", status: "abandoned",
    score: 45, questionsAnswered: 2, totalQuestions: 5, duration: "12 min",
    questions: mockQuestions.slice(0, 2).map((q) => ({
      question: q.question, answer: "Sample answer provided during interview.",
      evaluation: { ...mockEvaluation, score: Math.floor(Math.random() * 3) + 4 },
    })),
  },
];
