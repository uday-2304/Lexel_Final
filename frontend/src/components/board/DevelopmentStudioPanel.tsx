import { useState, useEffect, useRef } from 'react'
import { X, Code2, Play, RotateCcw, Maximize2, Minimize2 } from 'lucide-react'
import { useChat } from 'ai/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const TABS = ['Website Generator', 'Code Generator', 'Code Correction & Explanation', 'README Generator']

export default function DevelopmentStudioPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const key = localStorage.getItem('brainforge_gemini_key')
    if (key) setApiKey(key)
  }, [])

  // Create individual chat instances for each tab so they retain their own state
  const websiteGenChat = useChat({ api: '/api/chat', id: 'website-gen', onError: err => console.error(err) })
  const codeGenChat = useChat({ api: '/api/chat', id: 'code-gen', onError: err => console.error(err) })
  const codeCorrectionChat = useChat({ api: '/api/chat', id: 'code-correction', onError: err => console.error(err) })
  const readmeGenChat = useChat({ api: '/api/chat', id: 'readme-gen', onError: err => console.error(err) })

  const getActiveChat = () => {
    if (activeTab === 'Website Generator') return websiteGenChat
    if (activeTab === 'Code Generator') return codeGenChat
    if (activeTab === 'Code Correction & Explanation') return codeCorrectionChat
    return readmeGenChat
  }

  const { messages, input, handleInputChange, handleSubmit, isLoading } = getActiveChat()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const onSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!input.trim()) return alert('Please enter code specifications.')
    if (!apiKey) {
      alert("Please configure your Gemini API Key on the home page first.")
      return
    }

    // Submit with the appropriate mode
    handleSubmit(e as any, { 
      data: { 
        apiKey: apiKey,
        mode: activeTab
      } 
    })
  }

  // Find the last assistant message to display as the generated document
  const generatedDocument = [...messages].reverse().find(m => m.role === 'assistant')?.content

  return (
    <div className={`transition-all duration-300 ease-in-out bg-[#0A0D14]/90 backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col pointer-events-auto overflow-hidden ${
      isFullScreen 
        ? 'fixed inset-4 z-[100] rounded-3xl w-auto h-auto' 
        : 'absolute right-[84px] top-[80px] z-50 w-[460px] h-[600px] rounded-2xl'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-transparent shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-500" />
          <h2 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">
            Development Studio
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5">
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 p-4 border-b border-white/5 hide-scrollbar shrink-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                  : 'bg-[#1A1F2E]/60 text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-5 hide-scrollbar">
          
          {/* Output Area */}
          {generatedDocument ? (
            <div className="flex-1 overflow-y-auto text-slate-300 text-[14px] leading-relaxed hide-scrollbar pr-2 pb-10">
              <div className="
                [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mb-4 [&>h1]:mt-6 
                [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-blue-200 [&>h2]:mb-3 [&>h2]:mt-5 [&>h2]:border-b [&>h2]:border-white/10 [&>h2]:pb-2
                [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-slate-200 [&>h3]:mb-2 [&>h3]:mt-4
                [&>p]:mb-4
                [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul>li]:mb-1
                [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>ol>li]:mb-1
                [&>strong]:text-blue-300 [&>strong]:font-semibold
                [&>pre]:bg-[#1A1F2E] [&>pre]:border [&>pre]:border-white/10 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:mb-4
                [&>pre>code]:bg-transparent [&>pre>code]:p-0 [&>pre>code]:text-sm
                [&>code]:bg-[#1A1F2E] [&>code]:text-blue-300 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:text-[13px]
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {generatedDocument}
                </ReactMarkdown>
              </div>
              
              {/* Loading Indicator */}
              {isLoading && (
                 <div className="mt-4 flex items-center gap-1.5 h-[42px] bg-blue-500/10 w-fit px-4 py-2 rounded-xl border border-blue-500/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <>
              {/* Input */}
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Implementation Details
                </label>
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={`Describe your code requirements here to generate a ${activeTab}...`}
                  className="w-full flex-1 min-h-[200px] bg-black/40 border border-white/10 rounded-xl p-5 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 resize-none shadow-inner backdrop-blur-md transition-all leading-relaxed"
                />
              </div>
            </>
          )}

        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-white/5 bg-transparent shrink-0">
           {generatedDocument && !isLoading ? (
             <button 
               onClick={() => getActiveChat().setMessages([])}
               className="w-full py-3.5 rounded-xl bg-[#1A1F2E] hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2 transition-colors border border-white/10"
             >
               <RotateCcw className="w-4 h-4" />
               Start Over
             </button>
           ) : (
             <button 
               onClick={onSubmit}
               disabled={isLoading || !input.trim()}
               className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:shadow-none"
             >
               <Play className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} fill="currentColor" />
               {isLoading ? 'Generating...' : `Generate ${activeTab.split(' ')[0]}`}
             </button>
           )}
        </div>

      </div>
    </div>
  )
}
