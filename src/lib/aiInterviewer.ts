/**
 * SmartHire AI Interviewer Engine
 * Powered by OpenAI GPT with full conversation context management.
 * Falls back to an intelligent simulation mode when no API key is present.
 */

export type InterviewStage =
  | 'greeting'
  | 'candidate_confirmation'
  | 'self_introduction'
  | 'warmup'
  | 'technical'
  | 'scenario'
  | 'behavioral'
  | 'leadership'
  | 'candidate_questions'
  | 'feedback_summary'
  | 'closing';

export interface ConversationMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp?: number;
  stage?: InterviewStage;
}

export interface ResumeData {
  skills?: string[];
  projects?: string[];
  experience?: string;
  education?: string;
  technologies?: string[];
  certifications?: string[];
  achievements?: string[];
  rawText?: string;
}

export interface InterviewConfig {
  company: string;
  role: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  candidateName?: string;
  resume?: ResumeData;
  durationMinutes?: number;
}

export interface EvaluationScore {
  technical: number;
  communication: number;
  confidence: number;
  grammar: number;
  vocabulary: number;
  problemSolving: number;
  leadership: number;
  behavioral: number;
  overall: number;
  eyeContact: number;
  voiceClarity: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  speakingSpeedWpm?: number;
  fillerWordsCount?: number;
}

export interface InterviewResult {
  scores: EvaluationScore;
  strengths: string[];
  weaknesses: string[];
  mistakes: string[];
  suggestions: string[];
  resources: string[];
  summary: string;
  transcript: ConversationMessage[];
  duration: number;
  questionCount: number;
  stage: InterviewStage;
}

// ─────────────────────────────────────────────
//  System prompt builder
// ─────────────────────────────────────────────
function buildSystemPrompt(config: InterviewConfig): string {
  const { company, role, difficulty, candidateName, resume } = config;

  const difficultyInstructions = {
    Easy: 'Ask foundational questions. Be encouraging. Keep a supportive tone.',
    Medium: 'Ask intermediate-level questions. Be professional and balanced. Expect solid answers.',
    Hard: 'Ask advanced, challenging questions. Be rigorous. Probe deeply. Expect expert-level responses.',
  }[difficulty];

  const resumeContext = resume?.rawText
    ? `\n\nCANDIDATE RESUME CONTEXT:\n${resume.rawText.slice(0, 2000)}\n\nUse this resume to ask personalized questions about their specific projects, technologies, and experiences. Do NOT ask generic questions when specific ones are possible.`
    : '';

  const roleSpecificGuidance = getRoleGuidance(role, company);

  return `You are Alex, a professional senior interviewer at ${company} conducting a real job interview for the position of ${role}.

PERSONALITY: You are warm, professional, curious, and thorough — like a real human interviewer. Use natural conversational language, not robotic phrases. Occasionally use filler words like "Great", "I see", "Interesting", "That's a good point". Never say "As an AI" or mention that you are an AI.

INTERVIEW FORMAT:
- Current difficulty level: ${difficulty}
- ${difficultyInstructions}
- Candidate name: ${candidateName || 'the candidate'}
- Company: ${company}
- Role: ${role}

INTERVIEW STAGES (follow in order):
1. greeting — Warm greeting, introduce yourself as Alex from ${company}
2. candidate_confirmation — Confirm candidate name and readiness
3. self_introduction — Ask candidate to introduce themselves briefly
4. warmup — 1-2 light questions to ease into the interview
5. technical — 3-5 deep technical questions specific to ${role}
6. scenario — 2-3 real-world scenario questions relevant to ${company}
7. behavioral — 2-3 STAR-format behavioral questions
8. leadership — 1-2 leadership/ownership questions
9. candidate_questions — Ask if they have questions for you
10. feedback_summary — Give honest, constructive summary of performance
11. closing — Warm goodbye with timeline expectations

CRITICAL RULES:
- NEVER repeat a question you have already asked
- ALWAYS generate follow-up questions based on candidate's actual answers
- Keep each message to 2-4 sentences maximum
- Ask ONE question at a time — never bundle multiple questions
- Adapt difficulty based on how well the candidate is answering
- If candidate gives a weak answer, probe gently: "Can you elaborate on that?" or "Could you walk me through a specific example?"
- If candidate gives a strong answer, acknowledge it and go deeper
- After ~12-15 exchanges, naturally move to closing

ROLE-SPECIFIC GUIDANCE:
${roleSpecificGuidance}
${resumeContext}

Start by greeting the candidate warmly when the stage is "greeting".`;
}

function getRoleGuidance(role: string, company: string): string {
  const roleMap: Record<string, string> = {
    'Software Engineer': `Focus on: data structures, algorithms, system design, code quality, OOP principles, ${company}-specific engineering culture.`,
    'Frontend Developer': 'Focus on: React/Vue/Angular, CSS, performance optimization, accessibility, browser APIs, state management, responsive design.',
    'Backend Developer': 'Focus on: REST APIs, databases, microservices, caching strategies, authentication, scalability, message queues.',
    'Full Stack Developer': 'Cover both frontend and backend. Ask about architectural decisions and how they handle full-stack challenges.',
    'Android Developer': 'Focus on: Kotlin/Java, Jetpack Compose, MVVM/MVI, coroutines, Room, Retrofit, performance, Google Play.',
    'iOS Developer': 'Focus on: Swift, SwiftUI, UIKit, Core Data, Combine, memory management, App Store guidelines.',
    'Data Scientist': 'Focus on: ML algorithms, Python, pandas/numpy, model evaluation, A/B testing, statistical thinking.',
    'Machine Learning Engineer': 'Focus on: model training, MLOps, deployment, feature engineering, distributed training, model monitoring.',
    'AI Engineer': 'Focus on: LLMs, prompt engineering, RAG, fine-tuning, AI safety, evaluation frameworks, production AI systems.',
    'DevOps Engineer': 'Focus on: CI/CD, Docker, Kubernetes, cloud platforms, monitoring, infrastructure as code, SRE principles.',
    'Cloud Engineer': `Focus on: ${company === 'Amazon' ? 'AWS' : company === 'Google' ? 'GCP' : 'Azure'} services, cloud architecture, cost optimization, security, networking.`,
    'Cyber Security Engineer': 'Focus on: threat modeling, OWASP, penetration testing, incident response, security architecture, compliance.',
    'QA Engineer': 'Focus on: test automation, Selenium/Cypress, test planning, CI integration, API testing, bug lifecycle.',
    'HR Interview': 'Focus on: cultural fit, motivation, values alignment, work ethic, communication, career goals.',
    'Behavioral Interview': 'Focus exclusively on STAR-method behavioral questions about real experiences.',
    'Leadership Principles': `Focus on: ${company === 'Amazon' ? "Amazon's 16 Leadership Principles with specific examples" : 'leadership style, team management, conflict resolution, decision making.'}`,
    'System Design': 'Deep dive into system design: scalability, reliability, availability, consistency, trade-offs, real-world architecture.',
    'Product Manager': 'Focus on: product thinking, metrics, prioritization, stakeholder management, customer empathy, roadmap decisions.',
    'Data Analyst': 'Focus on: SQL, Python/R, data visualization, business intelligence, statistical analysis, storytelling with data.',
  };

  return roleMap[role] || `Focus on core technical skills and ${company}-specific culture relevant to ${role}.`;
}

// ─────────────────────────────────────────────
//  Stage manager — determines next stage
// ─────────────────────────────────────────────
const STAGE_SEQUENCE: InterviewStage[] = [
  'greeting', 'candidate_confirmation', 'self_introduction', 'warmup',
  'technical', 'scenario', 'behavioral', 'leadership',
  'candidate_questions', 'feedback_summary', 'closing',
];

const STAGE_EXCHANGE_TARGETS: Partial<Record<InterviewStage, number>> = {
  greeting: 1,
  candidate_confirmation: 1,
  self_introduction: 2,
  warmup: 2,
  technical: 6,
  scenario: 4,
  behavioral: 4,
  leadership: 2,
  candidate_questions: 2,
  feedback_summary: 2,
  closing: 1,
};

export function getNextStage(current: InterviewStage): InterviewStage {
  const idx = STAGE_SEQUENCE.indexOf(current);
  if (idx === -1 || idx === STAGE_SEQUENCE.length - 1) return 'closing';
  return STAGE_SEQUENCE[idx + 1];
}

// ─────────────────────────────────────────────
//  Fallback simulation — no API key needed
// ─────────────────────────────────────────────
const SIMULATION_RESPONSES: Partial<Record<InterviewStage, string[]>> = {
  greeting: [
    "Good {time}! I'm Alex, Senior Engineering Manager at {company}. Welcome to your interview for the {role} position. It's great to meet you. Are you ready to get started?",
  ],
  candidate_confirmation: [
    "Wonderful! Could you confirm your name and tell me a little bit about where you're joining from today?",
  ],
  self_introduction: [
    "Could you start by giving me a brief introduction — who you are, your background, and what drew you to this {role} role at {company}?",
  ],
  warmup: [
    "Before we dive into the technical questions — what's been the most exciting project or challenge you've worked on recently?",
    "Tell me about your current tech stack and how you chose it for your most recent project.",
  ],
  technical: [
    "Let's get into the technical side. Can you walk me through how you'd design a scalable system that needs to handle 10 million users?",
    "How do you approach debugging a production issue where you have minimal logging information?",
    "What's your understanding of SOLID principles, and can you give me a real example where you applied one of them?",
    "Explain the difference between horizontal and vertical scaling. When would you choose one over the other?",
    "How do you ensure code quality in a fast-moving team? What processes do you put in place?",
  ],
  scenario: [
    "Imagine you joined {company} and on your second day, the production system goes down affecting thousands of users. What's your immediate response?",
    "Your team is 2 weeks from a launch deadline and a critical bug is found that will take 10 days to fix. How do you handle this situation?",
  ],
  behavioral: [
    "Tell me about a time when you had to push back on a decision made by your manager. How did you handle it?",
    "Describe a situation where you had to learn something completely new in a very short timeframe. What was your approach?",
    "Give me an example of a time when you failed at something important. What happened and what did you learn?",
  ],
  leadership: [
    "Tell me about a time you led a team through a difficult or ambiguous situation. What was your leadership style?",
    "How do you mentor junior engineers? Can you give a specific example of how you helped someone grow?",
  ],
  candidate_questions: [
    "We're getting close to the end of our session. Do you have any questions for me about the role, the team culture at {company}, or what success looks like in the first 90 days?",
  ],
  feedback_summary: [
    "Thank you for a wonderful conversation. I'm going to share some honest feedback: I was really impressed by your communication skills and the depth of your technical thinking. I'd encourage you to continue deepening your knowledge in system design. Overall, you've performed very well today.",
  ],
  closing: [
    "It was truly a pleasure speaking with you today. We'll review your performance and get back to you within 5-7 business days. Best of luck with the rest of your process, and have a wonderful {time}!",
  ],
};

function simulateResponse(stage: InterviewStage, config: InterviewConfig, exchangeCount: number): string {
  const responses = SIMULATION_RESPONSES[stage] || ["That's great. Can you tell me more about your experience?"];
  const raw = responses[Math.min(exchangeCount, responses.length - 1)];
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return raw
    .replace(/{company}/g, config.company)
    .replace(/{role}/g, config.role)
    .replace(/{time}/g, time);
}

// ─────────────────────────────────────────────
//  Main AI Interviewer class
// ─────────────────────────────────────────────
export class AIInterviewer {
  private history: ConversationMessage[] = [];
  private config: InterviewConfig;
  private currentStage: InterviewStage = 'greeting';
  private stageExchangeCount: number = 0;
  private totalExchanges: number = 0;
  private apiKey: string | null = null;

  constructor(config: InterviewConfig) {
    this.config = config;
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || null;

    // Initialize system message
    this.history.push({
      role: 'system',
      content: buildSystemPrompt(config),
      timestamp: Date.now(),
    });
  }

  get stage(): InterviewStage { return this.currentStage; }
  get exchanges(): number { return this.totalExchanges; }
  get conversationHistory(): ConversationMessage[] { return this.history.filter(m => m.role !== 'system'); }

  /**
   * Add a user (candidate) message to history
   */
  addCandidateResponse(transcript: string): void {
    this.history.push({
      role: 'user',
      content: transcript,
      timestamp: Date.now(),
      stage: this.currentStage,
    });
    this.totalExchanges++;
    this.stageExchangeCount++;
  }

  /**
   * Generate the next AI interviewer message
   */
  async generateNextMessage(): Promise<{ text: string; stage: InterviewStage; isEnding: boolean }> {
    // Advance stage if enough exchanges have happened
    const stageTarget = STAGE_EXCHANGE_TARGETS[this.currentStage] ?? 2;
    if (this.stageExchangeCount >= stageTarget && this.currentStage !== 'closing') {
      this.currentStage = getNextStage(this.currentStage);
      this.stageExchangeCount = 0;
    }

    const isEnding = this.currentStage === 'closing';

    let text: string;

    if (this.apiKey) {
      text = await this.callOpenAI();
    } else {
      text = simulateResponse(this.currentStage, this.config, this.stageExchangeCount);
    }

    // Store AI response in history
    this.history.push({
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
      stage: this.currentStage,
    });

    return { text, stage: this.currentStage, isEnding };
  }

  /**
   * Call OpenAI GPT API with full conversation context
   */
  private async callOpenAI(): Promise<string> {
    try {
      // Add current stage instruction to the last system prompt
      const stageInstruction: ConversationMessage = {
        role: 'system',
        content: `Current stage: ${this.currentStage}. Stage exchange count: ${this.stageExchangeCount}. Total exchanges: ${this.totalExchanges}. Generate your next interviewer message appropriate for this stage.`,
      };

      const messages = [
        ...this.history.filter(m => m.role === 'system').map(m => ({ role: m.role, content: m.content })),
        ...this.history.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
        { role: stageInstruction.role, content: stageInstruction.content },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          max_tokens: 200,
          temperature: 0.75,
          presence_penalty: 0.6,
          frequency_penalty: 0.5,
        }),
      });

      if (!response.ok) {
        console.warn('OpenAI API error, falling back to simulation:', response.status);
        return simulateResponse(this.currentStage, this.config, this.stageExchangeCount);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || simulateResponse(this.currentStage, this.config, this.stageExchangeCount);
    } catch (err) {
      console.warn('OpenAI call failed, using simulation:', err);
      return simulateResponse(this.currentStage, this.config, this.stageExchangeCount);
    }
  }

  /**
   * Analyze a candidate's response and return dimension scores
   */
  analyzeResponse(transcript: string, durationMs: number = 10000): Partial<EvaluationScore> {
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const durationMinutes = durationMs / 60000;
    const speakingSpeedWpm = durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 0;

    // Communication: based on word count and sentence structure
    const communication = Math.min(100, Math.max(30,
      wordCount < 10 ? 40 :
      wordCount < 30 ? 60 :
      wordCount < 80 ? 78 :
      wordCount < 150 ? 88 : 92
    ));

    // Grammar: rough heuristic (look for common errors)
    const commonErrors = ['i am', 'i have', 'i was'].filter(e => transcript.toLowerCase().includes(e)).length;
    const grammar = Math.min(100, Math.max(50, 85 - (commonErrors * 2) + Math.random() * 10));

    // Vocabulary: unique words ratio
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const vocabRatio = uniqueWords / Math.max(wordCount, 1);
    const vocabulary = Math.min(100, Math.max(40, Math.round(vocabRatio * 120)));

    // Confidence & Filler Words
    const hesitationWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically'];
    const fillerWordsCount = hesitationWords.filter(h => transcript.toLowerCase().includes(h)).length;
    const confidence = Math.min(100, Math.max(40, 88 - (fillerWordsCount * 8) + Math.random() * 8));

    // Technical: keyword matching for technical content
    const technicalKeywords = ['implement', 'algorithm', 'design', 'architecture', 'database', 'api', 'performance', 'scalab', 'async', 'pattern', 'testing', 'deploy', 'optimize'];
    const techCount = technicalKeywords.filter(k => transcript.toLowerCase().includes(k)).length;
    const technical = Math.min(100, Math.max(30, 50 + techCount * 8 + Math.random() * 10));

    return { 
      communication: Math.round(communication), 
      grammar: Math.round(grammar), 
      vocabulary: Math.round(vocabulary), 
      confidence: Math.round(confidence), 
      technical: Math.round(technical),
      speakingSpeedWpm,
      fillerWordsCount 
    };
  }

  /**
   * Generate the final interview result with all scores
   */
  generateResult(durationSeconds: number, accumulatedScores: Partial<EvaluationScore>[]): InterviewResult {
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

    const getScores = (key: keyof EvaluationScore) =>
      accumulatedScores.map(s => s[key] as number).filter(Boolean);

    const technical = avg(getScores('technical').length ? getScores('technical') : [72]);
    const communication = avg(getScores('communication').length ? getScores('communication') : [78]);
    const confidence = avg(getScores('confidence').length ? getScores('confidence') : [75]);
    const grammar = avg(getScores('grammar').length ? getScores('grammar') : [80]);
    const vocabulary = avg(getScores('vocabulary').length ? getScores('vocabulary') : [76]);
    const problemSolving = Math.round(technical * 0.8 + confidence * 0.2);
    const leadership = Math.round(communication * 0.6 + confidence * 0.4);
    const behavioral = Math.round(communication * 0.7 + grammar * 0.3);
    const eyeContact = Math.round(70 + Math.random() * 20);
    const voiceClarity = Math.round(communication * 0.8 + confidence * 0.2);
    const overall = Math.round((technical + communication + confidence + grammar + vocabulary + problemSolving) / 6);

    const sentiment: 'positive' | 'neutral' | 'negative' =
      overall >= 80 ? 'positive' : overall >= 65 ? 'neutral' : 'negative';

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (technical >= 80) strengths.push('Strong technical knowledge');
    if (communication >= 80) strengths.push('Excellent communication skills');
    if (confidence >= 80) strengths.push('High confidence and articulate delivery');
    if (grammar >= 85) strengths.push('Clear and grammatically correct speech');
    if (vocabulary >= 80) strengths.push('Rich and varied vocabulary');

    if (technical < 70) weaknesses.push('Technical depth needs improvement');
    if (communication < 70) weaknesses.push('Answers could be more structured and detailed');
    if (confidence < 70) weaknesses.push('Work on reducing hesitation words');
    if (vocabulary < 65) weaknesses.push('Expand technical vocabulary');

    const suggestions = [
      'Practice the STAR method for behavioral questions',
      'Study system design fundamentals with real-world examples',
      'Record yourself answering questions to improve delivery',
      'Review common data structures and algorithm patterns',
      'Research the company culture and recent news before interviews',
    ];

    const resources = [
      'Cracking the Coding Interview — Gayle Laakmann McDowell',
      'System Design Interview — Alex Xu',
      'LeetCode (Top Interview Questions)',
      'Grokking the System Design Interview (Educative)',
      'Behavioral Interview Prep — Jeff H. Lawson (YouTube)',
    ];

    const summary = `You completed a ${Math.round(durationSeconds / 60)}-minute ${this.config.difficulty} ${this.config.role} interview at ${this.config.company}. Your overall performance score is ${overall}%. ${sentiment === 'positive' ? 'Excellent work!' : sentiment === 'neutral' ? 'Good effort with room for improvement.' : 'Keep practicing — you will get there.'}`;

    return {
      scores: { technical, communication, confidence, grammar, vocabulary, problemSolving, leadership, behavioral, eyeContact, voiceClarity, overall, sentiment },
      strengths,
      weaknesses,
      mistakes: weaknesses.map(w => w),
      suggestions,
      resources,
      summary,
      transcript: this.conversationHistory,
      duration: durationSeconds,
      questionCount: this.totalExchanges,
      stage: this.currentStage,
    };
  }
}
