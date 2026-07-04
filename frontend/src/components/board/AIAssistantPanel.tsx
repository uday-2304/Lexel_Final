import { useState, useEffect, useRef } from 'react'
import { X, Brain, Sparkles, MessageSquare, Lightbulb, Send, Paperclip, Trash2, Maximize2, Minimize2 } from 'lucide-react'
import { useEditor } from 'tldraw'
import { useChat, Message } from 'ai/react'

const TABS = ['Ask AI', 'Chat with Workspace', 'Explain Ideas']

export default function AIAssistantPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editor = useEditor()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const key = localStorage.getItem('brainforge_gemini_key')
    if (key) setApiKey(key)
  }, [])

  // Helper to extract board context
  const getBoardContext = () => {
    if (!editor) return ''
    const shapes = Array.from(editor.getCurrentPageShapes())
    if (shapes.length === 0) return 'The board is currently empty.'
    
    // Function to safely extract text purely from the richText structure (or text fallback)
    const extractTextFromRichText = (obj: any): string => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      if (Array.isArray(obj)) return obj.map(extractTextFromRichText).filter(Boolean).join(' ');
      if (typeof obj === 'object') {
        if (obj.type === 'text' && typeof obj.text === 'string') return obj.text;
        if (obj.content) return extractTextFromRichText(obj.content);
      }
      return '';
    }

    // Create a simplified text representation of the board without exact coordinates
    return shapes.map(shape => {
      let textContent = '';
      if (typeof (shape.props as any).text === 'string') {
        textContent = (shape.props as any).text;
      } else if ((shape.props as any).richText) {
        textContent = extractTextFromRichText((shape.props as any).richText);
      }
      
      if (textContent && textContent.trim().length > 0) {
        return `"${textContent.trim()}"`;
      }
      return null;
    }).filter(Boolean).join('\n')
  }

  const askAIChat = useChat({ api: '/api/chat', id: 'ask-ai', onError: err => console.error(err) })
  const workspaceChat = useChat({ api: '/api/chat', id: 'chat-workspace', onError: err => console.error(err) })
  const explainChat = useChat({ api: '/api/chat', id: 'explain-ideas', onError: err => console.error(err) })

  const getActiveChat = () => {
    if (activeTab === 'Ask AI') return askAIChat
    if (activeTab === 'Chat with Workspace') return workspaceChat
    return explainChat
  }

  const { messages, setMessages, input, handleInputChange, handleSubmit, isLoading, append } = getActiveChat()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setAttachedImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Load from local storage for all chats
  useEffect(() => {
    try {
      const savedAsk = localStorage.getItem('lexel_ai_messages_ask_ai')
      if (savedAsk) askAIChat.setMessages(JSON.parse(savedAsk))
      const savedWorkspace = localStorage.getItem('lexel_ai_messages_workspace')
      if (savedWorkspace) workspaceChat.setMessages(JSON.parse(savedWorkspace))
      const savedExplain = localStorage.getItem('lexel_ai_messages_explain')
      if (savedExplain) explainChat.setMessages(JSON.parse(savedExplain))
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save to local storage when messages change
  useEffect(() => {
    if (askAIChat.messages.length > 0) localStorage.setItem('lexel_ai_messages_ask_ai', JSON.stringify(askAIChat.messages))
    if (workspaceChat.messages.length > 0) localStorage.setItem('lexel_ai_messages_workspace', JSON.stringify(workspaceChat.messages))
    if (explainChat.messages.length > 0) localStorage.setItem('lexel_ai_messages_explain', JSON.stringify(explainChat.messages))
  }, [askAIChat.messages, workspaceChat.messages, explainChat.messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Custom submit handler to inject context and api key
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!apiKey) {
      alert("Please configure your Gemini API Key on the home page first.")
      return
    }

    const requestData = {
      apiKey: apiKey,
      mode: activeTab,
      contextText: activeTab !== 'Ask AI' ? getBoardContext() : '',
      attachedImage: attachedImage || ''
    }
    
    if (!input.trim() && attachedImage) {
      append({ role: 'user', content: 'Please analyze this attached image.' }, { data: requestData })
    } else {
      handleSubmit(e, { data: requestData })
    }
    setAttachedImage(null)
  }

  const clearChat = () => {
    setMessages([])
    if (activeTab === 'Ask AI') localStorage.removeItem('lexel_ai_messages_ask_ai')
    if (activeTab === 'Chat with Workspace') localStorage.removeItem('lexel_ai_messages_workspace')
    if (activeTab === 'Explain Ideas') localStorage.removeItem('lexel_ai_messages_explain')
    setShowClearConfirm(false)
  }

  return (
    <div className={`transition-all duration-300 ease-in-out bg-[#0A0D14]/90 backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col pointer-events-auto overflow-hidden ${
      isFullScreen 
        ? 'fixed inset-4 z-[100] rounded-3xl w-auto h-auto' 
        : 'absolute right-[84px] top-[80px] z-50 w-[460px] h-[600px] rounded-2xl'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-transparent">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h2 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">
            AI Assistant
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowClearConfirm(true)} className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Clear Chat">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5">
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>
        </div>
      </div>
      {/* Confirmation Modal for Clearing Chat */}
      {showClearConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1F2E] p-5 rounded-xl border border-slate-700 shadow-xl max-w-[80%] text-center">
            <h3 className="text-white text-sm font-bold mb-2">Clear Chat History?</h3>
            <p className="text-slate-400 text-xs mb-5">This will permanently delete the conversation for the "{activeTab}" tab.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={clearChat} className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">Clear Chat</button>
            </div>
          </div>
        </div>
      )}
      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 p-4 border-b border-white/5 custom-scrollbar hide-scrollbar shrink-0">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-[#1A1F2E] text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 hide-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((m: Message) => (
            <div key={m.id} className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
              <div className="text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase">
                {m.role === 'user' ? 'You' : 'AI'}
              </div>
              <div 
                className={`p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 text-white rounded-tr-sm' 
                    : 'bg-[#131722]/80 backdrop-blur-md text-slate-200 border border-white/5 rounded-tl-sm'
                }`}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        
        {/* Loading Animation */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex flex-col max-w-[85%] self-start">
            <div className="text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase">AI</div>
            <div className="p-3 rounded-2xl bg-[#131722]/80 backdrop-blur-md border border-white/5 rounded-tl-sm shadow-sm flex items-center justify-center gap-1.5 h-[42px] px-4">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/70 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/70 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/70 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={onSubmit} className="p-4 border-t border-white/5 bg-transparent shrink-0 flex flex-col gap-3">
        {attachedImage && (
          <div className="relative self-start">
            <img src={attachedImage} alt="Attachment preview" className="h-16 w-16 object-cover rounded-lg border border-slate-700" />
            <button 
              type="button" 
              onClick={() => setAttachedImage(null)}
              className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-0.5 border border-slate-600 hover:bg-slate-700"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
        <div className="relative flex items-center">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          
          <input
            value={input || ''}
            onChange={handleInputChange}
            placeholder={`Send a message to ${activeTab}...`}
            className="w-full bg-black/40 border border-white/10 rounded-full pl-11 pr-12 py-3 text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 shadow-inner backdrop-blur-md transition-all relative z-0"
          />

          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-2 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors z-10 cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button 
            type="submit"
            disabled={(!input.trim() && !attachedImage) || isLoading}
            className="absolute right-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700 transition-colors z-10"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
