import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;
    const data = body.data || body;
    const apiKey = data.apiKey || body.apiKey;
    const contextText = data.contextText || body.contextText;
    const mode = data.mode || body.mode;
    const attachedImage = data.attachedImage || body.attachedImage;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Initialize Google AI with the provided API key and Google Search Grounding for live web data
    const google = createGoogleGenerativeAI({
      apiKey,
      fetch: async (url, init) => {
        if (init && init.body && typeof init.body === 'string') {
          try {
            const parsed = JSON.parse(init.body);
            // Enable Google Search Grounding for real-time web access
            if (!parsed.tools) {
              parsed.tools = [{ google_search: {} }];
            } else if (Array.isArray(parsed.tools) && !parsed.tools.some((t: any) => t.google_search || t.googleSearch)) {
              parsed.tools.push({ google_search: {} });
            }
            init = {
              ...init,
              body: JSON.stringify(parsed),
            };
          } catch (e) {}
        }
        return fetch(url, init);
      },
    });

    let systemPrompt = `You are a helpful, creative, and up-to-date AI assistant integrated into a collaborative whiteboard called Lexel.

CURRENT TIME & KNOWLEDGE MANDATE:
- Today's date is: ${currentDate}.
- You have access to modern, up-to-date knowledge up to the present day. Never assume your cutoff is 2024.
- When answering factual questions about sports, trophies, records, current events, recent releases, or news:
  * Provide the complete, comprehensive, and up-to-date answer.
  * For sports franchises (like Royal Challengers Bangalore / RCB, Chelsea, Mumbai Indians, etc.), provide the breakdown across all formats/leagues (e.g., Men's IPL: 0 trophies, Women's WPL: 1 trophy won in WPL 2024).`;

    // Project Generator Modes
    if (['Roadmap Document', 'Task Breakdown', 'Project Step-by-Step'].includes(mode)) {
      systemPrompt = `You are an expert project manager and technical lead. Today's date: ${currentDate}.`;
      if (mode === 'Roadmap Document') {
        systemPrompt += "\n\nYour ONLY duty is to provide a high-level roadmap and timeline based on the project context. Do not provide detailed task breakdowns or step-by-step guides. Only provide a roadmap.";
      } else if (mode === 'Task Breakdown') {
        systemPrompt += "\n\nYour ONLY duty is to break the project down into specific tasks and sub-tasks with explanations. Do not provide a high-level roadmap or general step-by-step guide.";
      } else if (mode === 'Project Step-by-Step') {
        systemPrompt += "\n\nYour ONLY duty is to provide a sequential, chronological step-by-step execution plan. Do not provide timelines or scattered task lists.";
      }
      systemPrompt += "\n\nYou MUST format your response beautifully using Markdown (headings, lists, bold text).";
    } 
    // Development Studio Modes
    else if (['Website Generator', 'Code Generator', 'Code Correction & Explanation', 'README Generator'].includes(mode)) {
      systemPrompt = `You are an expert software engineer and technical lead. Today's date: ${currentDate}. Always use modern syntax, packages, and practices.`;
      if (mode === 'Website Generator') {
        systemPrompt += "\n\nYour ONLY duty is to generate full, working code for building a website based on the user's prompt. Provide modern HTML/CSS/JS or framework code. Do not provide unrelated DSA logic or generic text.";
      } else if (mode === 'Code Generator') {
        systemPrompt += "\n\nYour ONLY duty is to generate algorithms, logic, and Data Structures (DSA) code based on the user's prompt. Provide clean, optimized code. Do not build full websites.";
      } else if (mode === 'Code Correction & Explanation') {
        systemPrompt += "\n\nYour ONLY duty is to review, correct, and explain the code provided by the user. Do not generate entirely new websites from scratch.";
      } else if (mode === 'README Generator') {
        systemPrompt += "\n\nYour ONLY duty is to generate a comprehensive README.md file including project description, tech stack, and features. Do not write the actual source code.";
      }
      systemPrompt += "\n\nYou MUST format your response beautifully using Markdown (headings, lists, bold text, and proper code blocks).";
    }
    // Repository Analyzer Mode
    else if (['Repository Analysis'].includes(mode)) {
      systemPrompt = `You are an expert DevSecOps engineer and Repository Analyzer. Today's date: ${currentDate}.`;
      systemPrompt += "\n\nYour ONLY duty is to analyze the repository URL or codebase provided by the user. Give a comprehensive breakdown of the tech stack, potential architecture, and code quality. Do not provide unrelated step-by-step generic guides.";
      systemPrompt += "\n\nYou MUST format your response beautifully using Markdown (headings, lists, bold text).";
    }
    // Chat / Board Assistant Modes
    else {
      if (mode === 'Chat with Workspace') {
        systemPrompt += `\n\nThe user is currently looking at a whiteboard. They have asked a question about it. Here is the current textual representation of the whiteboard's shapes and contents: \n\n<board_context>\n${contextText}\n</board_context>\n\nIMPORTANT: Your ONLY duty is to explain and provide information on the contents of the whiteboard. Do not answer general questions that are unrelated to the whiteboard. Focus entirely on the semantic ideas, the text written, and the concepts presented on the whiteboard.`;
      } else if (mode === 'Explain Ideas') {
        systemPrompt += `\n\nThe user is currently looking at a whiteboard. Your ONLY duty is to explain the ideas currently present on the whiteboard, provide guidance on how to start, and offer tips on how to explain or present the topic on the board. Focus on helping the user expand and present the ideas they have written. Here is the current textual representation of the whiteboard: \n\n<board_context>\n${contextText}\n</board_context>`;
      } else {
        // Ask AI / General Chat
        systemPrompt += `\n\nYou are answering in 'Ask AI' mode. Provide complete, accurate, comprehensive, and up-to-date answers to whatever the user asks. Format your response cleanly and readably.`;
      }
    }

    // Inject system prompt into messages manually to avoid "system_instruction not supported" errors
    // with older models or older SDK versions.
    const allMessages: any[] = [
      { role: 'user', content: systemPrompt },
      { role: 'assistant', content: 'Understood. I will follow your instructions strictly.' },
      ...messages
    ];

    if (attachedImage && allMessages.length > 0) {
      const lastMessageIndex = allMessages.findLastIndex(m => m.role === 'user');
      if (lastMessageIndex !== -1) {
        const lastUserMessage = allMessages[lastMessageIndex];
        
        let base64Data = attachedImage;
        if (attachedImage.startsWith('data:')) {
           base64Data = attachedImage.split(',')[1];
        }

        lastUserMessage.content = [
          { type: 'text', text: typeof lastUserMessage.content === 'string' ? lastUserMessage.content : 'Please analyze this image.' },
          { type: 'image', image: base64Data } // Base64 string is supported natively
        ];
      }
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
    let resultStream: any = null;
    let errors: string[] = [];

    for (const modelName of fallbackModels) {
      try {
        resultStream = await streamText({
          model: google(modelName),
          messages: allMessages as any,
          temperature: 0.7,
          maxRetries: 0,
        });
        break; // Success
      } catch (err: any) {
        errors.push(`[${modelName}] ${err.message}`);
        console.warn(`Model ${modelName} failed:`, err.message);
      }
    }

    if (!resultStream) {
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

      throw new Error(`Failed to connect to AI models. ${errors[0] || 'Please check your API key.'}`);
    }

    return resultStream.toDataStreamResponse();
  } catch (error: any) {
    console.error("AI Assistant API Error:", error);
    let msg = error.message || 'Internal Server Error';
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error?.message) msg = parsed.error.message;
      else if (parsed.error) msg = parsed.error;
    } catch {}
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
