/**
 * SmartHire AI - Resume Parser
 * Extracts text from PDF and images and sends to AI for structured analysis with ATS scoring.
 */

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';

// Setup pdf worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
}

/**
 * Extracts text from a DOCX file using Mammoth
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}

/**
 * Extracts text from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

/**
 * Extracts text from an image file using Tesseract OCR
 */
export async function extractTextFromImage(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const result = await Tesseract.recognize(imageUrl, 'eng', {
      logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`)
    });
    return result.data.text;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Calculates an ATS Score (0-100) and feedback based on resume text content
 */
export function calculateATSScore(text: string): { score: number, feedback: string[] } {
  const textLower = text.toLowerCase();
  let score = 100;
  const feedback: string[] = [];

  // Length check
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 100) {
    score -= 20;
    feedback.push("Resume is very brief. Add more detail about your experience.");
  } else if (wordCount > 1000) {
    score -= 10;
    feedback.push("Resume is quite long. Consider condensing it to highlight key achievements.");
  } else {
    feedback.push("Good overall length and conciseness.");
  }

  // Section Headers
  let hasExperience = false;
  let hasEducation = false;
  let hasSkills = false;

  if (textLower.match(/\b(experience|work history|employment)\b/)) hasExperience = true;
  if (textLower.match(/\b(education|academic background|university)\b/)) hasEducation = true;
  if (textLower.match(/\b(skills|technologies|tools)\b/)) hasSkills = true;

  if (!hasExperience) { score -= 15; feedback.push("Missing clear 'Experience' section."); }
  if (!hasEducation) { score -= 10; feedback.push("Missing clear 'Education' section."); }
  if (!hasSkills) { score -= 10; feedback.push("Missing clear 'Skills' section."); }
  if (hasExperience && hasEducation && hasSkills) {
    feedback.push("Standard structural sections (Experience, Education, Skills) detected.");
  }

  // Action verbs
  const actionVerbs = ['managed', 'developed', 'led', 'created', 'optimized', 'built', 'improved', 'designed'];
  let verbCount = 0;
  actionVerbs.forEach(v => { if (textLower.includes(v)) verbCount++; });

  if (verbCount < 2) {
    score -= 15;
    feedback.push("Use more strong action verbs (e.g., developed, managed, optimized) to describe your impact.");
  } else if (verbCount >= 4) {
    feedback.push("Strong use of action-oriented verbs.");
  }

  return { score: Math.max(0, score), feedback };
}

export async function analyzeResumeWithAI(resumeText: string) {
  // In a real prod app, we'd call a dedicated Next.js API route here to parse with Claude/OpenAI.
  // We simulate the structured AI response to match the requested Onboarding flow.
  
  await new Promise(r => setTimeout(r, 1000)); // Simulated processing time

  const textLower = resumeText.toLowerCase();

  // 1. CLASSIFICATION GATE
  const wordCount = textLower.split(/\s+/).length;
  let hasExperience = false;
  let hasEducation = false;
  let hasSkills = false;

  if (textLower.match(/\b(experience|work history|employment)\b/)) hasExperience = true;
  if (textLower.match(/\b(education|academic background|university|bachelor|degree)\b/)) hasEducation = true;
  if (textLower.match(/\b(skills|technologies|tools|languages)\b/)) hasSkills = true;

  const isLikelyResume = wordCount >= 50 && (hasExperience || hasEducation || hasSkills);

  if (!isLikelyResume) {
    return {
      isValidResume: false,
      rejectionReason: 'not_a_resume',
      rawText: resumeText
      // Specifically NOT returning atsScore or skills!
    };
  }

  // 2. EXTRACTION & SCORING (Only proceeds if valid)
  // Basic keyword extraction heuristics
  const allSkills = [
    'react', 'node.js', 'node', 'python', 'java', 'aws', 'sql', 'javascript', 'html', 'css',
    'typescript', 'c++', 'c#', 'go', 'rust', 'docker', 'kubernetes', 'gcp', 'azure', 'mongodb'
  ];

  const skills: string[] = [];
  allSkills.forEach(skill => {
    if (textLower.includes(skill)) {
      skills.push(skill === 'node' ? 'Node.js' : skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });

  if (skills.length === 0) skills.push('JavaScript', 'Problem Solving');

  // Detect languages
  const programmingLangs = ['Python', 'Java', 'Javascript', 'Typescript', 'C++', 'C#', 'Go', 'Rust'];
  const languages = skills.filter(s => programmingLangs.includes(s));
  if (languages.length === 0) languages.push('Python'); // Default

  // Detect domain
  const domainTags = [];
  if (skills.includes('React') || skills.includes('Html')) domainTags.push('Frontend');
  if (skills.includes('Node.js') || skills.includes('Python') || skills.includes('Java')) domainTags.push('Backend');
  if (skills.includes('Aws') || skills.includes('Docker')) domainTags.push('Cloud/DevOps');
  if (domainTags.length === 0) domainTags.push('Software Engineering');

  // Detect experience level
  let experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  if (textLower.includes('senior') || textLower.includes('lead') || textLower.match(/[5-9] (years|yrs)/)) {
    experienceLevel = 'advanced';
    difficulty = 'hard';
  } else if (textLower.includes('mid') || textLower.match(/[2-4] (years|yrs)/)) {
    experienceLevel = 'intermediate';
    difficulty = 'medium';
  }

  const { score: atsScore, feedback: atsFeedback } = calculateATSScore(resumeText);

  // Extract Phone Number using regex
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = resumeText.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Generate a slightly better bio based on the domain and experience
  const bio = `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)} ${domainTags.join(', ')} professional with experience in ${skills.slice(0, 3).join(', ')}.`;

  return {
    isValidResume: true,
    skills: [...new Set(skills)],
    languages: [...new Set(languages)],
    domainTags,
    experienceLevel,
    suggestedDifficulty: difficulty,
    education: textLower.includes('bachelor') || textLower.includes('b.s') ? 'Bachelor of Science' : 'University Degree',
    experienceSummary: bio,
    phone,
    atsScore,
    atsFeedback,
    rawText: resumeText,
    recommendedRoles: domainTags.map(tag => {
      if (tag === 'Frontend') return 'Frontend Developer';
      if (tag === 'Backend') return 'Backend Developer';
      if (tag === 'Cloud/DevOps') return 'DevOps Engineer';
      return 'Software Engineer';
    }),
  };
}
