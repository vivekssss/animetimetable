
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
        ? `Current live anime schedule context: ${JSON.stringify(currentSchedule.slice(0, 15).map((a: any) => ({ id: a.id, title: a.title, score: a.score, studio: a.studio, genres: a.genres, airingDay: a.airingDay })))}.`
        : '';

      const systemPrompt = `You are AniFlow AI, an enthusiastic, expert anime assistant. ${scheduleContext}
      You can answer questions about anime plots, character lore, recommendations, voice actors, upcoming releases, streaming platforms, and studio info.
      Keep answers engaging, helpful, and concise (2-4 paragraphs or markdown bullet points).
      If you mention specific anime titles in your recommendations or answer, list their exact titles clearly under a line starting with "RECOMMENDED_TITLES: Title 1, Title 2, Title 3" at the very end of your response so the frontend can display interactive anime cards for them.`;

      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-6).forEach((h: any) => {
          contents.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const text = response.text || "I couldn't process your question right now.";
      
      // Parse RECOMMENDED_TITLES if present
      let suggestedTitles: string[] = [];
      if (text.includes("RECOMMENDED_TITLES:")) {
        const parts = text.split("RECOMMENDED_TITLES:");
        const cleanText = parts[0].trim();
        const rawTitles = parts[1].trim();
        suggestedTitles = rawTitles.split(",").map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean).slice(0, 5);
        res.json({ text: cleanText, suggestedTitles });
        return;
      }

      res.json({ text, suggestedTitles });
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: "Failed to generate chat response" });
    }
  });

  app.post('/api/gemini/trivia', async (req, res) => {
    const { category } = req.body;
    try {
      const prompt = `Generate a fun, engaging multiple-choice anime trivia question${category ? ` related to ${category}` : ''}.
      Provide 4 options (A, B, C, D), specify the correct option index (0 for A, 1 for B, 2 for C, 3 for D), and provide a 1-sentence fun fact explanation.
      Return strictly JSON with keys: "question", "options" (array of 4 strings), "correctIndex" (number 0-3), and "explanation" (string).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const data = JSON.parse(response.text || '{}');
      res.json(data);
    } catch (error) {
      console.error("Trivia Error:", error);
      res.status(500).json({ error: "Failed to generate trivia" });
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
