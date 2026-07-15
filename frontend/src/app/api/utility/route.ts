import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, mode, apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is required' }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    
    let systemPrompt = '';
    if (mode === 'Text to Flowchart') {
      systemPrompt = 'You are a strict JSON generator. Convert the user prompt into a flowchart. Output strictly ONLY valid JSON, nothing else. Format: { "nodes": [ {"id": "1", "text": "Step 1"} ], "edges": [ {"from": "1", "to": "2"} ] }';
    } else {
      systemPrompt = 'You are a helpful assistant. Generate a concise, useful text response based on the user prompt. This text will be placed on a whiteboard.';
    }

    const fallbackModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    let finalResultText: string | null = null;
    let errors: string[] = [];

    for (const modelName of fallbackModels) {
      try {
        const { text } = await generateText({
          model: google(modelName),
          system: systemPrompt,
          prompt: prompt,
          maxRetries: 0,
        });
        finalResultText = text;
        break; // Success
      } catch (err: any) {
        errors.push(`[${modelName}] ${err.message}`);
        console.warn(`Model ${modelName} failed:`, err.message);
      }
    }

    if (!finalResultText) {
      throw new Error(`Failed to generate text. Errors: ${errors.join(' | ')}`);
    }

    return NextResponse.json({ result: finalResultText.trim() });
  } catch (error: any) {
    console.error("Utility API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
