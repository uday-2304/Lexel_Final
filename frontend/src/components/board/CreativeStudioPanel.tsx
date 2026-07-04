import { useState } from 'react'
import { X, Palette, Image as ImageIcon, Play, PenTool, Maximize2, Minimize2 } from 'lucide-react'
import { useEditor } from 'tldraw'

const TABS = ['Image Generator', 'Icon Generator']

export default function CreativeStudioPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const editor = useEditor()

  const handleAction = async () => {
    setErrorMsg(null)
    if (!input.trim()) {
      setErrorMsg('Please enter a description for the creative asset.')
      return
    }
    setIsProcessing(true)
    
    try {
      const finalPrompt = input.trim();
      
      // Pass 'mode' to the backend to specify Icon vs Image
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt, mode: activeTab }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to generate image.')
      }
      
      const contentType = response.headers.get('Content-Type') || ''
      if (contentType.includes('application/json')) {
        const data = await response.json()
        if (data.icons && data.icons.length > 0) {
           const files = data.icons.map((svgStr: string, i: number) => {
              const blob = new Blob([svgStr], { type: 'image/svg+xml' })
              return new File([blob], `icon-${i}-${Date.now()}.svg`, { type: 'image/svg+xml' })
           })
           editor.putExternalContent({
             type: 'files',
             files: files,
             point: editor.getViewportPageBounds().center,
             ignoreParent: false
           })
        }
      } else {
        // Handle single image blob from Pollinations AI
        const blob = await response.blob()
        const extension = blob.type === 'image/svg+xml' ? 'svg' : 'png'
        const file = new File([blob], `generated-${activeTab.split(' ')[0].toLowerCase()}-${Date.now()}.${extension}`, { type: blob.type })
        
        editor.putExternalContent({
          type: 'files',
          files: [file],
          point: editor.getViewportPageBounds().center,
          ignoreParent: false
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
          <Palette className="w-5 h-5 text-blue-500" />
          <h2 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">
            Creative Studio
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
            {activeTab === 'Image Generator' ? (
              <ImageIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <PenTool className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-white">Direct-to-Board Assets</span>
              <span className="text-xs text-blue-200/70 leading-relaxed">
                Images generated here will be instantly dropped into the center of your whiteboard canvas.
              </span>
            </div>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Asset Description
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Describe the ${activeTab.split(' ')[0].toLowerCase()} you want to generate...`}
              className="w-full flex-1 min-h-[200px] bg-black/40 border border-white/10 rounded-xl p-5 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 resize-none shadow-inner backdrop-blur-md transition-all leading-relaxed"
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
             {isProcessing ? 'Generating Image...' : `Generate ${activeTab.split(' ')[0]}`}
           </button>
        </div>

      </div>
    </div>
  )
}
