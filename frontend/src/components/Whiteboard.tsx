'use client'

import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { TLStoreWithStatus } from 'tldraw'
import BoardHeader from './board/BoardHeader'
import CustomToolbar from './board/CustomToolbar'
import RightToolbar from './board/RightToolbar'
import PropertiesPanel from './board/PropertiesPanel'
import ExportPanel from './board/ExportPanel'

import AIAssistantPanel from './board/AIAssistantPanel'
import ProjectGeneratorPanel from './board/ProjectGeneratorPanel'
import DevelopmentStudioPanel from './board/DevelopmentStudioPanel'
import CreativeStudioPanel from './board/CreativeStudioPanel'
import RepositoryAnalyzerPanel from './board/RepositoryAnalyzerPanel'
import UtilitiesPanel from './board/UtilitiesPanel'

export default function Whiteboard({ 
  storeWithStatus,
  userProfile,
  boardId
}: { 
  storeWithStatus: TLStoreWithStatus
  userProfile: { name: string; color: string } | null
  boardId: string
}) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  
  useEffect(() => {
    setMounted(true)
    
    // Suppress annoying tldraw license warnings in console
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args: any[]) => {
      if (args.some(arg => typeof arg === 'string' && (arg.includes('tldraw license key') || arg.includes('sales@tldraw.com')))) return;
      originalConsoleError.apply(console, args as any);
    }
    
    console.warn = (...args: any[]) => {
      if (args.some(arg => typeof arg === 'string' && (arg.includes('tldraw license key') || arg.includes('sales@tldraw.com')))) return;
      originalConsoleWarn.apply(console, args as any);
    }

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    }
  }, [])

  useEffect(() => {
    if (editor && mounted) {
      editor.user.updateUserPreferences({
        colorScheme: theme === 'dark' ? 'dark' : 'light',
      })
    }
  }, [editor, theme, mounted])

  const handleMount = (ed: Editor) => {
    setEditor(ed)
    if (userProfile) {
      ed.user.updateUserPreferences({
        id: `user:${Math.random().toString(36).substring(2)}`,
        name: userProfile.name,
        color: userProfile.color,
      })
    }
  }

  // Periodic Thumbnail Generation
  useEffect(() => {
    if (!editor || !mounted || boardId.startsWith('board-guest-')) return
    
    const interval = setInterval(async () => {
      try {
        // Skip background generation if the user is actively drawing, panning, or interacting
        if (editor.inputs.isDragging || editor.inputs.isPointing) return
        
        const shapeIds = Array.from(editor.getCurrentPageShapeIds())
        if (shapeIds.length === 0) return
        
        const result = await editor.getSvgString(shapeIds, {
          padding: 32,
          background: true
        })
        
        if (result?.svg) {
          const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(result.svg)}`
          localStorage.setItem(`lexel_thumb_${boardId}`, svgUrl)
        }
      } catch (e) {
        // Ignore errors during export (e.g. concurrent operations)
      }
    }, 10000) // Every 10 seconds to prevent drawing stutter
    
    return () => clearInterval(interval)
  }, [editor, mounted, boardId])

  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  const [isProjectGeneratorOpen, setIsProjectGeneratorOpen] = useState(false)
  const [isDevelopmentStudioOpen, setIsDevelopmentStudioOpen] = useState(false)
  const [isCreativeStudioOpen, setIsCreativeStudioOpen] = useState(false)
  const [isRepositoryAnalyzerOpen, setIsRepositoryAnalyzerOpen] = useState(false)
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false)

  const closeAllPanels = () => {
    setIsPropertiesOpen(false)
    setIsExportOpen(false)
    setIsAIAssistantOpen(false)
    setIsProjectGeneratorOpen(false)
    setIsDevelopmentStudioOpen(false)
    setIsCreativeStudioOpen(false)
    setIsRepositoryAnalyzerOpen(false)
    setIsUtilitiesOpen(false)
  }

  return (
    <div className="w-full h-full absolute inset-0">
      <Tldraw 
        store={storeWithStatus} 
        onMount={handleMount}
        hideUi
      >
        <BoardHeader boardId={boardId} />
        <CustomToolbar />
        <RightToolbar 
          isPropertiesOpen={isPropertiesOpen} 
          onToggleProperties={() => { closeAllPanels(); setIsPropertiesOpen(!isPropertiesOpen) }}
          isExportOpen={isExportOpen}
          onToggleExport={() => { closeAllPanels(); setIsExportOpen(!isExportOpen) }}
          isAIAssistantOpen={isAIAssistantOpen}
          onToggleAIAssistant={() => { closeAllPanels(); setIsAIAssistantOpen(!isAIAssistantOpen) }}
          isProjectGeneratorOpen={isProjectGeneratorOpen}
          onToggleProjectGenerator={() => { closeAllPanels(); setIsProjectGeneratorOpen(!isProjectGeneratorOpen) }}
          isDevelopmentStudioOpen={isDevelopmentStudioOpen}
          onToggleDevelopmentStudio={() => { closeAllPanels(); setIsDevelopmentStudioOpen(!isDevelopmentStudioOpen) }}
          isCreativeStudioOpen={isCreativeStudioOpen}
          onToggleCreativeStudio={() => { closeAllPanels(); setIsCreativeStudioOpen(!isCreativeStudioOpen) }}
          isRepositoryAnalyzerOpen={isRepositoryAnalyzerOpen}
          onToggleRepositoryAnalyzer={() => { closeAllPanels(); setIsRepositoryAnalyzerOpen(!isRepositoryAnalyzerOpen) }}
          isUtilitiesOpen={isUtilitiesOpen}
          onToggleUtilities={() => { closeAllPanels(); setIsUtilitiesOpen(!isUtilitiesOpen) }}
        />
        
        {isPropertiesOpen && <PropertiesPanel onClose={() => setIsPropertiesOpen(false)} />}
        {isExportOpen && <ExportPanel onClose={() => setIsExportOpen(false)} />}

        {isAIAssistantOpen && <AIAssistantPanel onClose={() => setIsAIAssistantOpen(false)} />}
        {isProjectGeneratorOpen && <ProjectGeneratorPanel onClose={() => setIsProjectGeneratorOpen(false)} />}
        {isDevelopmentStudioOpen && <DevelopmentStudioPanel onClose={() => setIsDevelopmentStudioOpen(false)} />}
        {isCreativeStudioOpen && <CreativeStudioPanel onClose={() => setIsCreativeStudioOpen(false)} />}
        {isRepositoryAnalyzerOpen && <RepositoryAnalyzerPanel onClose={() => setIsRepositoryAnalyzerOpen(false)} />}
        {isUtilitiesOpen && <UtilitiesPanel onClose={() => setIsUtilitiesOpen(false)} />}

        {/* Bottom Hint Text */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-medium tracking-wide pointer-events-none">
          Use Hand Tool, Space+Drag, or Middle Mouse to Pan • Scroll to Zoom • Auto-saving enabled
        </div>

      </Tldraw>
    </div>
  )
}
