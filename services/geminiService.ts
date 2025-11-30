

import { GoogleGenAI } from "@google/genai";
import { Message, Role } from "../types";

export interface ImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

// NOTE: We do not instantiate a global 'ai' client anymore because the API key might change based on user settings.
// Instead, we instantiate it inside the streamChat function.

export const streamChat = async (
  history: Message[],
  newMessage: string,
  materialsContext: string = '',
  imageParts: ImagePart[] = [],
  onChunk: (text: string) => void,
  customApiKey?: string,
  customModel?: string
): Promise<string> => {
  try {
    const apiKey = customApiKey || process.env.API_KEY || '';
    
    // Fallback model or user specified model
    const modelName = customModel || 'gemini-2.5-flash';

    if (!apiKey) {
        throw new Error("Missing API Key. Please add your Gemini API Key in Settings.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // IMPORTANT: The history passed here likely includes the *latest* user message (due to optimistic UI updates).
    // The Gemini API requires the history to be the *previous* conversation turns, and the new message is sent separately.
    // If we include the new message in history AND send it as 'content', the model sees two consecutive user messages,
    // which violates the "User, Model, User, Model" alternation rule and causes an error.
    
    // Filter out the last message if it matches the new message being sent (simple check)
    // A more robust check uses the ID or checks if the last message is from USER.
    const effectiveHistory = history.length > 0 && history[history.length - 1].role === Role.USER
      ? history.slice(0, -1)
      : history;

    const chatHistory = effectiveHistory.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Construct system instruction with text context
    let systemInstruction = "你是一位专业的教育专家助手，专为中小学教师服务。你的名字叫 'TeacherMind'。你的目标是协助教师进行高质量的教学设计、项目化学习(PBL)规划、评价量规制作以及课堂活动设计。回答应专业、具体、结构清晰，符合现代教育理念（如核心素养、深度学习）。请始终使用 Markdown 格式输出，包括标题、列表、加粗等格式，以便用户直接复制使用。";
    
    if (materialsContext) {
      systemInstruction += `\n\n【重要】以下是用户提供的项目背景资料或课程内容（不包含图片，图片已作为多模态输入发送），请在回答中充分参考这些信息：\n${materialsContext}`;
    }

    const chat = ai.chats.create({
      model: modelName,
      history: chatHistory,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Prepare content parts for the new message
    const contentParts: any[] = [{ text: newMessage }];
    
    // Add image parts if any
    if (imageParts.length > 0) {
      contentParts.unshift(...imageParts);
    }

    const result = await chat.sendMessageStream({ 
      content: { parts: contentParts }
    });

    let fullText = '';
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }
    }
    
    return fullText;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Return a clearer error message if it's a 400 or related to keys
    if (error.message && error.message.includes('API key')) {
         throw new Error("Invalid API Key. Please check your settings.");
    }
    throw error;
  }
};