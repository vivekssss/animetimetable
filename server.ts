
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post('/api/gemini/chat', async (req, res) => {
    const { message, history, currentSchedule } = req.body;
    try {
      const scheduleContext = currentSchedule && currentSchedule.length > 0 
        ? `Current anime schedule context available: ${JSON.stringify(currentSchedule.map((a: any) => ({ title: a.title, score: a.score, studio: a.studio, genres: a.genres, airingTime: a.airingTime, episode: a.episode })))}.`
        : '';
        
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are AniFlow AI, an enthusiastic, knowledgeable anime expert assistant. ${scheduleContext}
        Help the user with anime recommendations, schedule details, plot overviews, character insights, or general otaku knowledge. Keep answers helpful, concise, visually clear, and enthusiastic.
        
        User question: "${message}"`,
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: "Failed to generate chat response" });
    }
  });

  app.post('/api/gemini/recommend', async (req, res) => {
    const { currentSchedule, userPreference } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Given the following anime schedule: ${JSON.stringify(currentSchedule)}.
        The user says: "${userPreference}". 
        Recommend the best anime from the list for them today. Explain why based on genres and themes.
        Return the response in a friendly, conversational tone.`,
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate recommendation" });
    }
  });

  app.post('/api/gemini/summarize', async (req, res) => {
    const { animeTitle } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Provide a short, 2-sentence spoiler-free hype summary for the anime "${animeTitle}". Focus on the stakes and unique premise.`,
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to summarize plot" });
    }
  });

  app.post('/api/gemini/trailer', async (req, res) => {
    const { animeTitle } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Find the official YouTube trailer video ID for the anime "${animeTitle}". 
        Return ONLY the 11-character YouTube video ID (for example: dQw4w9WgXcQ). If not found, return "null". Do not return full URLs, markdown formatting, or any explanations.`,
      });
      let text = (response.text || '').trim().replace(/```[a-z]*|```|\n|"/g, '');
      if (text.includes('v=')) {
        text = text.split('v=')[1]?.slice(0, 11) || text;
      } else if (text.includes('youtu.be/')) {
        text = text.split('youtu.be/')[1]?.slice(0, 11) || text;
      }
      const trailerId = (text && text !== 'null' && text.length >= 10) ? text.slice(0, 11) : null;
      res.json({ trailerId });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to find trailer" });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
