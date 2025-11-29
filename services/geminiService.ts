import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Block, Comment, OutlineSettings, TextSettings } from "../types";

// Helper to clean API key
const getAiClient = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

export const generateOutline = async (
  apiKey: string,
  model: string,
  language: string,
  topic: string,
  existingOutline?: Block[],
  settings?: OutlineSettings
): Promise<Partial<Block>[]> => {
  const ai = getAiClient(apiKey);

  const lengthInstruction = settings?.length === 'short' ? 'Keep the outline concise with fewer points (approx 3-5 main sections).'
    : settings?.length === 'long' ? 'Create a comprehensive, extensive outline with many sections.'
      : 'Create a standard length outline.';

  const detailInstruction = settings?.detailLevel === 'high' ? 'Ensure deep nesting and granular detail (use levels 0, 1, and 2 extensively).'
    : 'Keep high-level structure without too much nesting.';

  const systemInstruction = `You are an expert writing assistant. 
  Your task is to generate a structured outline for a given topic. 
  The outline should be detailed and broken down into logical blocks.
  Levels should be 0 (Main Section), 1 (Sub-section), 2 (Detail).
  
  Configuration:
  - Output Language: The generated content MUST be in ${language}.
  - ${lengthInstruction}
  - ${detailInstruction}

  ${existingOutline ? "Consider the existing outline provided by the user as a template structure. Adapt this structure to the new topic, keeping the logical flow but updating titles and adding specific details relevant to the topic." : ""}`;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "The title or main point of this outline block" },
        level: { type: Type.INTEGER, description: "Hierarchy level: 0, 1, or 2" },
      },
      required: ["title", "level"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: existingOutline
        ? `Refine and expand this outline based on the topic: ${topic}. Existing Structure: ${JSON.stringify(existingOutline.map(b => ({ title: b.title, level: b.level })))}`
        : `Generate a comprehensive outline for the topic: "${topic}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Outline Error:", error);
    throw error;
  }
};

export const generateContentFromBlocks = async (
  apiKey: string,
  model: string,
  language: string,
  blocks: Block[],
  topic: string,
  settings?: TextSettings,
  refinementInstructions?: Record<string, string> // Map blockId -> instruction
): Promise<Record<string, string>> => {
  const ai = getAiClient(apiKey);

  const blocksPayload = blocks.map(b => {
    let commentString = b.comments.map(c => `[${c.type.toUpperCase()}]: ${c.text}`).join("; ");

    // Append specific refinement instruction if it exists for this block
    if (refinementInstructions && refinementInstructions[b.id]) {
      commentString += ` ; [REFINEMENT INSTRUCTION - PRIORITY]: ${refinementInstructions[b.id]}`;
    }

    return {
      id: b.id,
      title: b.title,
      level: b.level,
      user_comments: commentString
    };
  });

  const systemInstruction = `You are a professional writer. 
  You will be given a list of outline blocks with IDs, titles, hierarchy levels, and optional user comments.
  Your task is to write the actual content (prose) for EACH block.
  
  Style & Tone Settings:
  - Output Language: The generated content MUST be in ${language}.
  - Tone: ${settings?.tone || 'formal'}
  - Custom Instructions: ${settings?.customInstructions || 'None'}
  
  Rules:
  1. Return a JSON object where keys are the block IDs and values are the generated text paragraph(s) for that block.
  2. STRICTLY adhere to the user comments.
  3. Ensure flow between blocks. Block N+1 should naturally follow Block N.
  4. **Headings:** Do NOT automatically treat the block title as a heading. Analyze the context. If a heading is needed for structure (e.g. starting a new major section), include it in the generated text using Markdown format (e.g. # for level 0, ## for level 1). If the block acts as a continuation or sub-point, just write the prose.
  5. The content should be appropriate for the outline level.
  `;

  const arraySchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        block_id: { type: Type.STRING },
        content: { type: Type.STRING }
      },
      required: ["block_id", "content"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: `Topic: ${topic}. \n\nOutline Blocks: ${JSON.stringify(blocksPayload)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: arraySchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const resultList = JSON.parse(text) as { block_id: string, content: string }[];

    // Convert array back to map
    const contentMap: Record<string, string> = {};
    resultList.forEach(item => {
      contentMap[item.block_id] = item.content;
    });

    return contentMap;
  } catch (error) {
    console.error("Gemini Content Gen Error:", error);
    throw error;
  }
};

export const generateSuggestion = async (
  apiKey: string,
  model: string,
  language: string,
  blockContent: string,
  userRemark: string
): Promise<string> => {
  const ai = getAiClient(apiKey);
  const systemInstruction = `You are a helpful writing assistant. 
    The user has provided some remarks or questions about a specific section of text.
    Your task is to provide a helpful response, suggestion, or answer based on their remark.
    Be concise and constructive.
    Output Language: The response MUST be in ${language}.`;

  try {
    const response = await ai.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: `Context (Current Text):\n${blockContent}\n\nUser Remark:\n${userRemark}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "No suggestion generated.";
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    throw error;
  }
};

export const generateBlocksFromContent = async (
  apiKey: string,
  currentText: string
): Promise<Partial<Block>[]> => {
  const ai = getAiClient(apiKey);
  const systemInstruction = `Analyze the provided text and extract a structured outline with content.
  Break the text down into logical blocks.
  For each block, provide:
  - title: A short summary title.
  - level: Hierarchy level (0 for main sections, 1 for subsections, 2 for details).
  - content: The actual text content belonging to this section.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        level: { type: Type.INTEGER },
        content: { type: Type.STRING },
      },
      required: ["title", "level", "content"],
    },
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Text to analyze: \n${currentText}`,
    config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text);
}
