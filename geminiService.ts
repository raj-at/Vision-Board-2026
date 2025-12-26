
import { GoogleGenAI, Type } from "@google/genai";
import { UserAnswers, BoardBlueprint } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateBoardBlueprint = async (answers: UserAnswers): Promise<BoardBlueprint> => {
  const prompt = `
    Based on the following user interview for their 2026 Vision Board, generate a comprehensive blueprint.
    User Interview Data: ${JSON.stringify(answers)}

    Requirements:
    1. A punchy board title.
    2. 3 core themes and 3 identity statements ("I am...").
    3. For each category selected, provide:
       - A vision statement (max 12 words)
       - A micro plan line (max 14 words)
       - A weekly habit
       - A milestone (max 8 words) with a target date in 2026
       - A detailed image generation prompt for an AI model (nano banana) following the style of "${answers.imageStyle}" and vibe "${answers.visualVibe}".
       - An optional affirmation/quote (max 12 words).
    4. A summary paragraph.
    5. A 5-point action plan for the next 7 days.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          board_title: { type: Type.STRING },
          theme_words: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
          identity_statements: { type: Type.ARRAY, items: { type: Type.STRING } },
          next_7_days: { type: Type.ARRAY, items: { type: Type.STRING } },
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                vision_line: { type: Type.STRING },
                micro_plan_line: { type: Type.STRING },
                habit_card: { type: Type.STRING },
                milestone_card: { type: Type.STRING },
                milestone_date: { type: Type.STRING },
                image_prompt: { type: Type.STRING },
                quote: { type: Type.STRING }
              },
              required: ["name", "vision_line", "micro_plan_line", "habit_card", "milestone_card", "milestone_date", "image_prompt"]
            }
          }
        },
        required: ["board_title", "theme_words", "summary", "identity_statements", "categories", "next_7_days"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateVisionImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return 'https://picsum.photos/800/800'; // Fallback
  } catch (error) {
    console.error("Image generation failed", error);
    return 'https://picsum.photos/800/800';
  }
};

export const regenerateCardContent = async (currentContent: string, instruction: string): Promise<string> => {
  const prompt = `Rewrite the following vision board card text: "${currentContent}". 
  Instruction for rewrite: ${instruction}. 
  Keep it under 15 words. Return ONLY the new text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });

  return response.text.trim().replace(/^"|"$/g, '');
};
