
import { Anime } from "../types";

export interface ChatMessageHistory {
  sender: 'user' | 'bot';
  text: string;
}

export const sendChatMessage = async (
  message: string,
  history: ChatMessageHistory[] = [],
  currentSchedule: Anime[] = []
) => {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, currentSchedule })
    });
    const data = await response.json();
    return {
      text: data.text || "I couldn't process your message right now. Try again!",
      suggestedTitles: data.suggestedTitles || []
    };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return {
      text: "I couldn't process your message right now. Please check your signal and try again!",
      suggestedTitles: []
    };
  }
};

export const getAnimeTrivia = async (category?: string) => {
  try {
    const response = await fetch('/api/gemini/trivia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Trivia error:", error);
    return null;
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
