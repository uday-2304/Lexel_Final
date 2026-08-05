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

    const fallbackModels = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp'
    ];
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
      const quotaError = errors.find(e => 
        e.toLowerCase().includes('quota') || 
        e.toLowerCase().includes('resource_exhausted') || 
        e.includes('429')
      );
      
      if (quotaError) {
        const retryMatch = quotaError.match(/retry in ([0-9.]+)s/i);
        const retryText = retryMatch 
          ? ` Please retry in ${Math.ceil(parseFloat(retryMatch[1]))} seconds.` 
          : ' Please wait a few moments before trying again.';
        throw new Error(`Gemini API Quota Exceeded: Your Google Gemini API rate limit was reached.${retryText} You can verify your key or quota at https://aistudio.google.com/`);
      }

      throw new Error(`Failed to generate text. ${errors[0] || 'Please check your API key.'}`);
    }

    return NextResponse.json({ result: finalResultText.trim() });
  } catch (error: any) {
    console.error("Utility API Error:", error);
    let msg = error.message || 'Internal Server Error';
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error?.message) msg = parsed.error.message;
      else if (parsed.error) msg = parsed.error;
    } catch {}
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
