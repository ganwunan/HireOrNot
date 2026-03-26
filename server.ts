import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure multer for memory storage
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  app.use(express.json());

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    try {
      const { company, jd } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No resume file uploaded' });
      }

      if (!company || !jd) {
        return res.status(400).json({ error: 'Company and Job Description are required' });
      }

      // Extract text from PDF
      const pdfData = await pdfParse(file.buffer);
      const resumeText = pdfData.text;

      // Call Gemini API
      const prompt = `
        You are an expert technical recruiter and hiring manager at ${company}.
        You are conducting a deep, rigorous, and critical analysis of a candidate's resume against a specific Job Description (JD).
        
        Job Description:
        ${jd}
        
        Candidate Resume:
        ${resumeText}
        
        Analyze the resume and provide a highly critical, realistic assessment. Do not hold back. Point out any fluff, missing skills, or inconsistencies.
        
        Provide the response in JSON format matching this schema:
        {
          "matchingScore": number (0-100),
          "strengths": string[] (List of 2-4 key strengths),
          "weaknesses": string[] (List of 2-4 critical weaknesses or red flags),
          "suggestedInterviewQuestions": string[] (List of 3 tough, probing interview questions based on their resume claims),
          "overallVerdict": string (A short, punchy 1-2 sentence verdict on whether to proceed with this candidate)
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchingScore: { type: Type.NUMBER },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestedInterviewQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              overallVerdict: { type: Type.STRING },
            },
            required: ['matchingScore', 'strengths', 'weaknesses', 'suggestedInterviewQuestions', 'overallVerdict'],
          },
        },
      });

      const analysisResult = JSON.parse(response.text || '{}');
      res.json(analysisResult);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      res.status(500).json({ error: 'Failed to analyze resume' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();