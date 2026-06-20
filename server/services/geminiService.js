const { GoogleGenAI, Type } = require('@google/genai');

const allowedCategories = ['quantitative', 'logical', 'verbal', 'technical'];
const allowedDifficulties = ['easy', 'medium', 'hard'];

const categoryLabels = {
  quantitative: 'Quantitative Aptitude',
  logical: 'Logical Reasoning',
  verbal: 'Verbal Ability',
  technical: 'Technical Aptitude',
};

const difficultyLabels = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const normalizeGeminiError = (error) => {
  const message = String(error.message || '');

  if (error.status === 401 || error.status === 403 || /api key|permission/i.test(message)) {
    const authError = new Error(
      'The Gemini API key is invalid or unauthorized. Update GEMINI_API_KEY in server/.env and restart the server.',
    );
    authError.status = 503;
    return authError;
  }

  if (error.status === 429 || /quota|resource_exhausted|rate limit/i.test(message)) {
    const quotaError = new Error(
      'Gemini quota is unavailable. Check Gemini API usage limits, then try again.',
    );
    quotaError.status = 503;
    return quotaError;
  }

  return error;
};

const generateAptitudeQuestions = async ({
  category = 'quantitative',
  difficulty = 'easy',
  count = 5,
}) => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error(
      'Question generation is not configured. Add GEMINI_API_KEY to server/.env.',
    );
    error.status = 503;
    throw error;
  }

  const topicLabel = categoryLabels[category] || categoryLabels.quantitative;
  const difficultyLabel = difficultyLabels[difficulty] || difficultyLabels.easy;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let response;
  try {
    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `Generate ${count} aptitude questions on ${topicLabel} with ${difficultyLabel} difficulty. Each question must have exactly four distinct options. The correctAnswer must exactly match one option. Keep each explanation concise and accurate.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          minItems: count,
          maxItems: count,
          items: {
            type: Type.OBJECT,
            required: ['question', 'options', 'correctAnswer', 'explanation'],
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                minItems: 4,
                maxItems: 4,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
          },
        },
      },
    });
  } catch (error) {
    throw normalizeGeminiError(error);
  }

  const generated = JSON.parse(response.text || '[]');
  if (!Array.isArray(generated) || generated.length !== count) {
    throw new Error(`Gemini returned ${generated.length || 0} questions instead of ${count}`);
  }

  return generated.map((item, index) => {
    const question = String(item.question || '').trim();
    const options = Array.isArray(item.options)
      ? item.options.map((option) => String(option).trim())
      : [];
    const correctAnswer = String(item.correctAnswer || '').trim();
    const explanation = String(item.explanation || '').trim();

    if (!question || options.length !== 4 || new Set(options).size !== 4) {
      throw new Error(`Generated question ${index + 1} is invalid`);
    }

    if (!options.includes(correctAnswer)) {
      throw new Error(`Generated question ${index + 1} has an invalid correct answer`);
    }

    if (!explanation) {
      throw new Error(`Generated question ${index + 1} has no explanation`);
    }

    return {
      question,
      options,
      correctAnswer,
      explanation,
      category,
      difficulty,
    };
  });
};

const generateMockTestQuestions = async ({
  company = 'General Placement',
  count = 10,
  difficulty = 'medium',
}) => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('Question generation is not configured. Add GEMINI_API_KEY to server/.env.');
    error.status = 503;
    throw error;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const difficultyLabel = difficultyLabels[difficulty] || difficultyLabels.medium;
  let response;
  try {
    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `Generate ${count} unique ${difficultyLabel} multiple-choice questions for a ${company} placement mock test. Use a balanced mix of quantitative aptitude, logical reasoning, verbal ability, and technical aptitude. Each question must have exactly four distinct options, one exact correctAnswer, a concise explanation, a category, and a difficulty.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          minItems: count,
          maxItems: count,
          items: {
            type: Type.OBJECT,
            required: ['question', 'options', 'correctAnswer', 'explanation', 'category', 'difficulty'],
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, minItems: 4, maxItems: 4, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              category: { type: Type.STRING, enum: allowedCategories },
              difficulty: { type: Type.STRING, enum: allowedDifficulties },
            },
          },
        },
      },
    });
  } catch (error) {
    throw normalizeGeminiError(error);
  }

  const generated = JSON.parse(response.text || '[]');
  if (!Array.isArray(generated) || generated.length !== count) {
    throw new Error(`Gemini returned ${generated.length || 0} questions instead of ${count}`);
  }

  return generated.map((item, index) => {
    const options = item.options.map((option) => String(option).trim());
    const correctAnswer = String(item.correctAnswer).trim();
    if (!item.question || options.length !== 4 || !options.includes(correctAnswer)) {
      throw new Error(`Generated mock question ${index + 1} is invalid`);
    }
    return {
      question: String(item.question).trim(),
      options,
      correctAnswer,
      explanation: String(item.explanation).trim(),
      category: item.category,
      difficulty,
    };
  });
};

const requireGeminiKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('AI Interviewer is not configured. Add GEMINI_API_KEY to server/.env.');
    error.status = 503;
    throw error;
  }
};

const generateInterviewQuestion = async ({ topic = 'HR', previousQuestions = [] }) => {
  requireGeminiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let response;
  try {
    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `Act as a placement interviewer. Ask one concise ${topic} interview question suitable for a graduate candidate. Do not repeat these previous questions: ${previousQuestions.join(' | ') || 'none'}.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['question'],
          properties: { question: { type: Type.STRING } },
        },
      },
    });
  } catch (error) { throw normalizeGeminiError(error); }
  const parsed = JSON.parse(response.text || '{}');
  const question = String(parsed.question || '').trim();
  if (!question) throw new Error('Gemini did not return an interview question.');
  return { question, topic };
};

const evaluateInterviewAnswer = async ({ question, answer, topic = 'HR' }) => {
  requireGeminiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let response;
  try {
    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `You are evaluating a graduate placement interview answer.
Topic: ${topic}
Question: ${question}
Candidate answer: ${answer}
Score communication, technicalKnowledge, and confidence from 1 to 10. For HR answers, technicalKnowledge means relevance, structure, and role awareness. Give concise constructive feedback, two strengths, and two improvements.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['communication', 'technicalKnowledge', 'confidence', 'feedback', 'strengths', 'improvements'],
          properties: {
            communication: { type: Type.INTEGER, minimum: 1, maximum: 10 },
            technicalKnowledge: { type: Type.INTEGER, minimum: 1, maximum: 10 },
            confidence: { type: Type.INTEGER, minimum: 1, maximum: 10 },
            feedback: { type: Type.STRING },
            strengths: { type: Type.ARRAY, minItems: 2, maxItems: 2, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, minItems: 2, maxItems: 2, items: { type: Type.STRING } },
          },
        },
      },
    });
  } catch (error) { throw normalizeGeminiError(error); }
  return JSON.parse(response.text || '{}');
};

module.exports = {
  allowedCategories,
  allowedDifficulties,
  generateAptitudeQuestions,
  evaluateInterviewAnswer,
  generateInterviewQuestion,
  generateMockTestQuestions,
};
