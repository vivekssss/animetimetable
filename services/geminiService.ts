
import { Anime } from "../types";

export const sendChatMessage = async (message: string, currentSchedule: Anime[] = []) => {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, currentSchedule })
    });
    const data = await response.json();
    return data.text || "I couldn't process your message right now. Try again!";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I couldn't process your message right now. Please check your signal and try again!";
  }
};

// Use process.env.API_KEY directly as a named parameter for initialization
export const getAnimeRecommendation = async (currentSchedule: Anime[], userPreference: string) => {
  try {
    const response = await fetch('/api/gemini/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentSchedule, userPreference })
    });
    const data = await response.json();
    return data.text || "I couldn't generate a recommendation right now.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I couldn't generate a recommendation right now. Why not try watching the highest rated one?";
  }
};

export const summarizePlot = async (animeTitle: string) => {
  try {
    const response = await fetch('/api/gemini/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animeTitle })
    });
    const data = await response.json();
    return data.text || "An epic journey awaits you in this season's latest release.";
  } catch (error) {
    return "An epic journey awaits you in this season's latest release.";
  }
};

export const getAiTrailerId = async (animeTitle: string) => {
  try {
    const response = await fetch('/api/gemini/trailer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animeTitle })
    });
    const data = await response.json();
    return data.trailerId !== 'null' ? data.trailerId : null;
  } catch (error) {
    return null;
  }
};
