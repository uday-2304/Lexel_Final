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

    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!modelsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch available models. Check your API key.' }, { status: 400 });
    }
    const modelsData = await modelsRes.json();
    const availableModels = modelsData.models || [];
    
    const generateModels = availableModels.filter((m: any) => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
    ).map((m: any) => m.name.replace('models/', ''));

    if (generateModels.length === 0) {
      return NextResponse.json({ error: 'No models found supporting generateContent for this API key.' }, { status: 400 });
    }

    const preferredOrder = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
    const fallbackModels: string[] = [];
    
    for (const pref of preferredOrder) {
      const matches = generateModels.filter((m: string) => m === pref || m.startsWith(`${pref}-`));
      fallbackModels.push(...matches);
    }
    for (const m of generateModels) {
      if (!fallbackModels.includes(m)) fallbackModels.push(m);
    }

    let lastError: any;
    let finalResultText: string | null = null;

    for (const modelName of fallbackModels) {
      try {
        const { text } = await generateText({
          model: google(modelName),
          system: systemPrompt,
          prompt: prompt,
        });
        finalResultText = text;
        break; // Success!
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err.message);
        lastError = err;
        continue; // Try next model
      }
    }

    if (!finalResultText) {
      throw lastError || new Error("All preferred models failed due to rate limits or unavailability.");
    }

    return NextResponse.json({ result: finalResultText.trim() });
  } catch (error: any) {
    console.error("Utility API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
