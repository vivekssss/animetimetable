
import { GoogleGenAI, Type } from "@google/genai";
import { Anime } from "../types";

// Use process.env.API_KEY directly as a named parameter for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAnimeRecommendation = async (currentSchedule: Anime[], userPreference: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Given the following anime schedule: ${JSON.stringify(currentSchedule)}.
      The user says: "${userPreference}". 
      Recommend the best anime from the list for them today. Explain why based on genres and themes.
      Return the response in a friendly, conversational tone.`,
      config: {
        temperature: 0.7,
      }
    });
    // Access the .text property directly for the extracted string output
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I couldn't generate a recommendation right now. Why not try watching the highest rated one?";
  }
};

export const summarizePlot = async (animeTitle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, 2-sentence spoiler-free hype summary for the anime "${animeTitle}". Focus on the stakes and unique premise.`,
    });
    // Access the .text property directly for the extracted string output
    return response.text;
  } catch (error) {
    return "An epic journey awaits you in this season's latest release.";
  }
};
