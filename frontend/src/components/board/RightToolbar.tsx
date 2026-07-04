import { Layers, Image as ImageIcon, Download, Brain, FileText, Code2, Palette, Search, Settings, Lock } from 'lucide-react'
import { useEditor } from 'tldraw'
import { useState, useEffect, useRef } from 'react'

const IconButton = ({ icon: Icon, onClick, active, tooltip, customActiveBg, isLocked }: { icon: any, onClick?: () => void, active?: boolean, tooltip: string, customActiveBg?: string, isLocked?: boolean }) => (
  <div className="relative group">
    <button 
      onClick={onClick}
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        isLocked 
          ? 'bg-[#0a0a0a] text-slate-600 cursor-not-allowed border border-slate-800/50'
          : active 
            ? `${customActiveBg || 'bg-[#E36814]'} text-white shadow-lg shadow-black/20` 
            : 'bg-[#111111] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
      }`}
    >
      <Icon className={`w-5 h-5 ${isLocked ? 'opacity-20' : ''}`} />
      {isLocked && <Lock className="absolute w-4 h-4 text-slate-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
    </button>
    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1A1F2E] border border-slate-700 text-slate-200 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl">
      {tooltip}
    </div>
  </div>
)

export default function RightToolbar({ 
  onToggleProperties,
  isPropertiesOpen,
  onToggleExport,
  isExportOpen,
  onToggleAIAssistant,
  isAIAssistantOpen,
  onToggleProjectGenerator,
  isProjectGeneratorOpen,
  onToggleDevelopmentStudio,
  isDevelopmentStudioOpen,
  onToggleCreativeStudio,
  isCreativeStudioOpen,
  onToggleRepositoryAnalyzer,
  isRepositoryAnalyzerOpen,
  onToggleUtilities,
  isUtilitiesOpen
}: { 
  onToggleProperties: () => void
  isPropertiesOpen: boolean
  onToggleExport: () => void
  isExportOpen: boolean
  onToggleAIAssistant: () => void
  isAIAssistantOpen: boolean
  onToggleProjectGenerator: () => void
  isProjectGeneratorOpen: boolean
  onToggleDevelopmentStudio: () => void
  isDevelopmentStudioOpen: boolean
  onToggleCreativeStudio: () => void
  isCreativeStudioOpen: boolean
  onToggleRepositoryAnalyzer: () => void
  isRepositoryAnalyzerOpen: boolean
  onToggleUtilities: () => void
  isUtilitiesOpen: boolean
}) {
  const editor = useEditor()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isAiLocked, setIsAiLocked] = useState(false)
  useEffect(() => {
    const hasKey = !!localStorage.getItem('brainforge_gemini_key')
    const isGuestBoard = window.location.pathname.includes('board-guest-')
    setIsAiLocked(!hasKey || isGuestBoard)
  }, [])

  const handleAIToggle = (toggleFn: () => void) => {
    if (isAiLocked) {
      alert("⚠️ AI Feature Locked\n\nYou must enter your Gemini API Key to use this feature. Please go to the Dashboard to set it up.")
      return
    }
    toggleFn()
  }



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    editor.putExternalContent({
      type: 'files',
      files: [file],
      point: editor.getViewportPageBounds().center
    })
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="absolute right-4 top-[110px] z-50 flex flex-col gap-3 pointer-events-auto overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar hide-scrollbar pb-4">
      {/* 9 Requested Agents/Studios */}
      <IconButton 
        icon={Brain} 
        active={isAIAssistantOpen} 
        onClick={() => handleAIToggle(onToggleAIAssistant)} 
        tooltip={!isAiLocked ? "AI Assistant" : "AI Assistant (Locked)"} 
        customActiveBg="bg-blue-600"
        isLocked={isAiLocked}
      />
      <IconButton 
        icon={FileText} 
        active={isProjectGeneratorOpen} 
        onClick={() => handleAIToggle(onToggleProjectGenerator)} 
        tooltip={!isAiLocked ? "Project Generator" : "Project Generator (Locked)"} 
        customActiveBg="bg-blue-600"
        isLocked={isAiLocked}
      />
      <IconButton 
        icon={Code2} 
        active={isDevelopmentStudioOpen} 
        onClick={() => handleAIToggle(onToggleDevelopmentStudio)} 
        tooltip={!isAiLocked ? "Development Studio" : "Development Studio (Locked)"} 
        customActiveBg="bg-blue-600"
        isLocked={isAiLocked}
      />
      <IconButton 
        icon={Palette} 
        active={isCreativeStudioOpen} 
        onClick={() => handleAIToggle(onToggleCreativeStudio)} 
        tooltip={!isAiLocked ? "Creative Studio" : "Creative Studio (Locked)"} 
        customActiveBg="bg-blue-600"
        isLocked={isAiLocked}
      />
      <IconButton 
        icon={Search} 
        active={isRepositoryAnalyzerOpen} 
        onClick={() => handleAIToggle(onToggleRepositoryAnalyzer)} 
        tooltip={!isAiLocked ? "Repository Analyzer" : "Repository Analyzer (Locked)"} 
        customActiveBg="bg-blue-600"
        isLocked={isAiLocked}
      />
      <IconButton 
        icon={Settings} 
        active={isUtilitiesOpen} 
        onClick={() => handleAIToggle(onToggleUtilities)} 
        tooltip={!isAiLocked ? "Utilities" : "Utilities (Locked)"} 
        customActiveBg="bg-blue-600"
        isLocked={isAiLocked}
      />

      <div className="w-full h-px bg-slate-800/50 my-1"></div>

      {/* Editor/Native Utilities */}
      <IconButton 
        icon={Layers} 
        active={isPropertiesOpen} 
        onClick={onToggleProperties} 
        tooltip="Editor Properties" 
        customActiveBg="bg-[#3B82F6]"
      />
      
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
      />
      <IconButton icon={ImageIcon} onClick={() => fileInputRef.current?.click()} tooltip="Insert Image" />
      
      <IconButton 
        icon={Download} 
        active={isExportOpen} 
        onClick={onToggleExport} 
        tooltip="Export Board" 
      />
    </div>
  )
}
