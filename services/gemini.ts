
import { GoogleGenAI } from "@google/genai";
import { RaceResult } from "../types.ts";

export const generateCommentary = async (results: RaceResult[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const winner = results.sort((a,b) => b.distance - a.distance)[0];

  const prompt = `You are a high-octane radio DJ for a highway racing station. 
  The chase has just ended. Here are the stats:
  ${results.map(r => `- ${r.playerName}: Covered ${r.distance}KM at speeds of ${r.topSpeed}KM/H`).join('\n')}
  
  Write a short, cinematic 2-3 sentence wrap-up. Mention how ${winner?.playerName} dominated the asphalt. 
  Make it sound like a scene from an action movie.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an edgy, energetic radio host. Use slang like 'rubber', 'asphalt', 'pedal to the metal'.",
        temperature: 1.0
      }
    });

    return response.text || "That was pure chaos on the highway! Someone call the paramedics because these drivers just broke the sound barrier!";
  } catch (error) {
    console.error("AI Commentary error:", error);
    return "The sirens are fading, but the legend of this chase will live on. Incredible driving out there!";
  }
};
