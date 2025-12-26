
import { GoogleGenAI, Type } from "@google/genai";
import { UserAnswers, BoardBlueprint } from "./types";

/**
 * Generates a full strategic blueprint for 2026 based on user interview responses.
 * Uses Gemini 3 Pro for advanced reasoning and structure generation.
 */
export const generateBoardBlueprint = async (answers: UserAnswers): Promise<BoardBlueprint> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Act as a high-performance life coach and visual designer.
    Analyze this 2026 Vision Interview: ${JSON.stringify(answers)}

    Tasks:
    1. Create a compelling, high-status Board Title.
    2. Extract 3 core themes and 3 powerful "I am" identity statements.
    3. For each category selected:
       - Vision: A 10-word aspirational goal.
       - Plan: A 12-word strategic step.
       - Habit: A concrete daily/weekly recurring action.
       - Milestone: A specific deadline-driven event for 2026.
       - Image Prompt: A high-detail descriptive prompt for Gemini Pro Image. 
         Focus on ${answers.imageStyle} style, ${answers.visualVibe} vibe, and ${answers.avoidColors ? 'avoiding ' + answers.avoidColors : 'vivid imagery'}.
       - Affirmation: A short, punchy mantra.
    4. Provide a holistic summary and a 'Next 7 Days' execution list.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 4000 },
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

  return JSON.parse(response.text || "{}");
};

/**
 * Generates an aspirational image using the Gemini 3 Pro Image model for 1K resolution.
 */
export const generateVisionImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return `https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=800`;
  } catch (error: any) {
    console.error("Image generation error:", error);
    // If key selection is missing, we might need the user to re-select
    if (error?.message?.includes("Requested entity was not found")) {
      console.warn("API key might need re-selection for Pro model.");
    }
    return `https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=800`;
  }
};

/**
 * Rewrites card content using Pro model for better style.
 */
export const regenerateCardContent = async (currentContent: string, instruction: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Transform this vision board text: "${currentContent}".
    Target transformation: ${instruction}.
    Constraint: Under 15 words. High energy. No fluff.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 0 } }
  });

  return response.text.trim().replace(/^"|"$/g, '');
};
