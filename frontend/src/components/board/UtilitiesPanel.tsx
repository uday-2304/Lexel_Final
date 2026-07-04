import { useState, useEffect } from 'react'
import { X, Settings, Network, Type, Play, Maximize2, Minimize2 } from 'lucide-react'
import { useEditor, toRichText } from 'tldraw'

const TABS = ['Text to Flowchart', 'Generate Board Text']

export default function UtilitiesPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const editor = useEditor()

  useEffect(() => {
    const key = localStorage.getItem('brainforge_gemini_key')
    if (key) setApiKey(key)
  }, [])

  const handleAction = async () => {
    setErrorMsg(null)
    if (!input.trim()) {
      setErrorMsg('Please enter some text or instructions.')
      return
    }
    if (!apiKey) {
      setErrorMsg('Please configure your Gemini API Key on the home page first.')
      return
    }

    setIsProcessing(true)
    
    try {
      // Step 1: Call our AI backend to generate Mermaid or Text
      const response = await fetch('/api/utility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input.trim(), mode: activeTab, apiKey }),
      })
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to generate output.')
      }

      const data = await response.json()
      const generatedText = data.result

      if (activeTab === 'Text to Flowchart') {
        // Robustly extract the JSON object in case the AI outputs markdown or conversational text
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
           throw new Error('AI failed to generate a valid flowchart JSON structure.')
        }
        const flowData = JSON.parse(jsonMatch[0])
        
        const startX = editor.getViewportPageBounds().center.x - 100
        let currentY = editor.getViewportPageBounds().center.y - (flowData.nodes.length * 60)
        const nodeMap = new Map()
        const shapesToCreate: any[] = []

        // Create nodes vertically
        flowData.nodes.forEach((node: any) => {
          // Tldraw IDs must be prefixed with 'shape:'
          const shapeId = `shape:node-${node.id}-${Date.now()}`
          shapesToCreate.push({
            id: shapeId,
            type: 'geo',
            x: startX,
            y: currentY,
            props: {
              geo: 'rectangle',
              richText: toRichText(node.text),
              w: 200,
              h: 80,
            }
          })
          nodeMap.set(node.id, shapeId)
          currentY += 140
        })

        // Connect them with arrows
        flowData.edges.forEach((edge: any, i: number) => {
          shapesToCreate.push({
            id: `shape:arrow-${i}-${Date.now()}`,
            type: 'arrow',
            props: {
              start: { type: 'binding', isExact: false, boundShapeId: nodeMap.get(edge.from) },
              end: { type: 'binding', isExact: false, boundShapeId: nodeMap.get(edge.to) }
            }
          })
        })

        // Insert all shapes into the Tldraw document at once
        editor.createShapes(shapesToCreate)
      } else {
        // Text to Board mode
        editor.createShape({
          type: 'text',
          x: editor.getViewportPageBounds().center.x,
          y: editor.getViewportPageBounds().center.y,
          props: {
            richText: toRichText(generatedText),
          }
        })
      }
      
      setInput('')
    } catch (error: any) {
      console.error(error)
      setErrorMsg(error.message || "Something went wrong.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={`transition-all duration-300 ease-in-out bg-[#0A0D14]/90 backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col pointer-events-auto overflow-hidden ${
      isFullScreen 
        ? 'fixed inset-4 z-[100] rounded-3xl w-auto h-auto' 
        : 'absolute right-[84px] top-[80px] z-50 w-[460px] h-[600px] rounded-2xl'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-transparent shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          <h2 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">
            Utilities
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
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 shrink-0">
            {activeTab === 'Text to Flowchart' ? (
              <Network className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <Type className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-white">{activeTab}</span>
              <span className="text-xs text-blue-200/70 leading-relaxed">
                {activeTab === 'Text to Flowchart' 
                  ? 'Describe a process and the AI will generate a visual flowchart on the board.'
                  : 'Ask the AI to generate ideas, code, or content directly as text on the board.'}
              </span>
            </div>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-2 flex-1 mt-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {activeTab === 'Text to Flowchart' ? 'Process Description' : 'Prompt / Question'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTab === 'Text to Flowchart' 
                ? 'e.g., User logs in -> Server validates -> If valid, show dashboard -> If invalid, show error'
                : 'e.g., Generate a list of 5 brainstorming ideas for a SaaS product...'}
              className="w-full flex-1 min-h-[150px] bg-black/40 border border-white/10 rounded-xl p-5 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 resize-none shadow-inner backdrop-blur-md transition-all leading-relaxed"
            />
          </div>

        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-white/5 bg-transparent shrink-0 flex flex-col gap-3">
           {errorMsg && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-start gap-2">
               <span className="font-bold text-red-500 shrink-0 mt-0.5">!</span>
               <span>{errorMsg}</span>
             </div>
           )}
           <button 
             onClick={handleAction}
             disabled={isProcessing || !input.trim()}
             className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:shadow-none"
           >
             <Play className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} fill="currentColor" />
             {isProcessing ? 'Generating...' : `Run ${activeTab}`}
           </button>
        </div>

      </div>
    </div>
  )
}
