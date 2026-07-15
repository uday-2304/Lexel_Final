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

    // Initialize Google AI with the provided API key
    const google = createGoogleGenerativeAI({
      apiKey,
    });

    let systemPrompt = "You are a helpful, creative AI assistant integrated into a collaborative whiteboard called Lexel. Your goal is to help users brainstorm, design, code, and solve problems.";
    
    // Project Generator Modes
    if (['Roadmap Document', 'Task Breakdown', 'Project Step-by-Step'].includes(mode)) {
      systemPrompt = "You are an expert project manager and technical lead.";
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
      systemPrompt = "You are an expert software engineer and technical lead.";
      if (mode === 'Website Generator') {
        systemPrompt += "\n\nYour ONLY duty is to generate full, working code for building a website based on the user's prompt. Provide HTML/CSS/JS or framework code. Do not provide unrelated DSA logic or generic text.";
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
      systemPrompt = "You are an expert DevSecOps engineer and Repository Analyzer.";
      systemPrompt += "\n\nYour ONLY duty is to analyze the repository URL or codebase provided by the user. Give a comprehensive breakdown of the tech stack, potential architecture, and code quality. Do not provide unrelated step-by-step generic guides.";
      systemPrompt += "\n\nYou MUST format your response beautifully using Markdown (headings, lists, bold text).";
    }
    // Chat / Board Assistant Modes
    else {
      // Chat / Board Assistant Modes
      systemPrompt += "\n\nIMPORTANT FORMATTING RULE: You MUST output ONLY plain text and numbers. Do NOT use ANY Markdown formatting whatsoever. Do not use asterisks (*), hashtags (#), bullet points, or any bolding/italics. Keep the output completely unformatted plain text.";

      if (mode === 'Chat with Workspace') {
        systemPrompt += `\nThe user is currently looking at a whiteboard. They have asked a question about it. Here is the current textual representation of the whiteboard's shapes and contents: \n\n<board_context>\n${contextText}\n</board_context>\n\nIMPORTANT: Your ONLY duty is to explain and provide information on the contents of the whiteboard. Do not answer general questions that are unrelated to the whiteboard. Do not mention raw shape types (like "geo shape" or "text shape") unless necessary. Focus entirely on the semantic ideas, the text written, and the concepts presented on the whiteboard. Answer naturally as if you are discussing the concepts themselves.`;
      } else if (mode === 'Explain Ideas') {
        systemPrompt += `\nThe user is currently looking at a whiteboard. Your ONLY duty is to explain the ideas currently present on the whiteboard, provide guidance on how to start, and offer tips on how to explain or present the topic on the board. Do not act like a general encyclopedia. Focus on helping the user expand and present the ideas they have written. Here is the current textual representation of the whiteboard: \n\n<board_context>\n${contextText}\n</board_context>\n\nIMPORTANT: Ignore the technical structure of the board (e.g. do not say "You have a note shape"). Speak directly about the ideas, text, and themes you observe.`;
      } else if (mode === 'Ask AI') {
        systemPrompt += `\nYou are a general-purpose AI assistant. You can answer anything the user asks. You are not strictly bound to the whiteboard context. Provide helpful and accurate information.`;
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
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest', 
      'gemini-1.5-pro-latest', 
      'gemini-1.5-flash', 
      'gemini-1.5-pro'
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
      throw new Error(`Failed to start AI stream. Errors: ${errors.join(' | ')}`);
    }

    return resultStream.toDataStreamResponse();
  } catch (error: any) {
    console.error("AI Assistant API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
