import { useEditor, GeoShapeGeoStyle } from 'tldraw'
import { useState, useEffect, useRef } from 'react'
import { 
  Undo2, Redo2, MousePointer2, Hand, Pen, Eraser, 
  Square, Circle, Type, ArrowUpRight, Grid3x3, ZoomIn, ZoomOut,
  Triangle, Diamond, Shapes, Minus, Share2, Trash2,
  StickyNote, Image as ImageIcon, Star, Hexagon, Cloud
} from 'lucide-react'

const ToolButton = ({ id, icon: Icon, onClick, tooltip, activeTool, setTool }: { id?: string, icon: any, onClick?: () => void, tooltip: string, activeTool?: string, setTool?: (id: string) => void }) => {
  const isActive = id === activeTool
  return (
    <div className="relative group">
      <button 
        onClick={onClick || (() => id && setTool && setTool(id))}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          isActive 
            ? 'bg-[#5C55F2] text-white shadow-lg shadow-[#5C55F2]/20' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Icon className="w-5 h-5" />
      </button>
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1A1F2E] border border-slate-700 text-slate-200 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl">
        {tooltip}
      </div>
    </div>
  )
}

const ActionButton = ({ icon: Icon, onClick, tooltip, disabled = false, active = false }: { icon: any, onClick: () => void, tooltip: string, disabled?: boolean, active?: boolean }) => (
  <div className="relative group">
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-transparent ${
        active ? 'bg-[#2A344A] text-white border border-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1A1F2E] border border-slate-700 text-slate-200 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl">
      {tooltip}
    </div>
  </div>
)

export default function CustomToolbar() {
  const editor = useEditor()
  const [activeTool, setActiveTool] = useState('select')
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [showShapes, setShowShapes] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isGridMode, setIsGridMode] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Sync UI with editor state
    const handleChange = () => {
      let current = editor.getCurrentToolId()
      if (current === 'geo') {
        const style = editor.getSharedStyles().getAsKnownValue(GeoShapeGeoStyle)
        if (style) {
          current = style
        }
      }
      setActiveTool(current)
      setCanUndo(editor.getCanUndo())
      setCanRedo(editor.getCanRedo())
      setIsGridMode(editor.getInstanceState().isGridMode)
    }
    editor.store.listen(handleChange, { source: 'user', scope: 'all' })
    editor.on('change', handleChange)
    handleChange()

    return () => {
      editor.off('change', handleChange)
    }
  }, [editor])

  const setTool = (id: string) => {
    try {
      const geoShapes = ['rectangle', 'ellipse', 'triangle', 'diamond', 'star', 'hexagon', 'cloud']
      if (geoShapes.includes(id)) {
        editor.setCurrentTool('geo')
        editor.setStyleForNextShapes(GeoShapeGeoStyle, id as any)
      } else {
        editor.setCurrentTool(id)
      }
    } catch (e) {
      console.warn("Failed to set tool:", id, e)
    }
  }

  const handleGridToggle = () => {
    editor.updateInstanceState({ isGridMode: !isGridMode })
  }

  const handleZoomIn = () => {
    const camera = editor.getCamera()
    editor.setCamera({ ...camera, z: camera.z * 1.05 })
  }

  const handleZoomOut = () => {
    const camera = editor.getCamera()
    editor.setCamera({ ...camera, z: camera.z * 0.95 })
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
    <div className="absolute left-4 top-[110px] z-50 pointer-events-none">
      <div className="bg-[#111111] border border-slate-800 rounded-2xl p-2 flex flex-col gap-2 pointer-events-auto shadow-xl w-[92px]">
        
        {/* Undo / Redo */}
        <div className="flex gap-1 justify-center">
          <ActionButton icon={Undo2} onClick={() => editor.undo()} disabled={!canUndo} tooltip="Undo" />
          <ActionButton icon={Redo2} onClick={() => editor.redo()} disabled={!canRedo} tooltip="Redo" />
        </div>
        
        <div className="h-px bg-slate-800 w-full my-1"></div>

        {/* Main Tools */}
        <div className="flex gap-1 justify-center">
          <ToolButton id="select" icon={MousePointer2} tooltip="Select" activeTool={activeTool} setTool={setTool} />
          <ToolButton id="hand" icon={Hand} tooltip="Hand Tool" activeTool={activeTool} setTool={setTool} />
        </div>
        <div className="flex gap-1 justify-center">
          <ToolButton id="draw" icon={Pen} tooltip="Draw" activeTool={activeTool} setTool={setTool} />
          <ToolButton id="eraser" icon={Eraser} tooltip="Eraser" activeTool={activeTool} setTool={setTool} />
        </div>
        
        {/* Shapes Menu */}
        <div className="flex gap-1 justify-center relative">
          <div className="relative group">
            <button 
              onClick={() => setShowShapes(!showShapes)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                ['rectangle', 'ellipse', 'triangle', 'diamond', 'line', 'arrow', 'star', 'hexagon', 'cloud'].includes(activeTool) || showShapes
                  ? 'bg-[#5C55F2] text-white shadow-lg shadow-[#5C55F2]/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shapes className="w-5 h-5" />
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1A1F2E] border border-slate-700 text-slate-200 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl">
              Shapes
            </div>
          </div>
          
          <div className="relative">
            <ActionButton 
              icon={Trash2} 
              onClick={() => setShowClearConfirm(true)} 
              tooltip="Clear Board" 
            />
            {showClearConfirm && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#1A1F2E] border border-red-900/50 rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-2 w-48 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-xs text-slate-300 font-medium">Clear entire board? This cannot be undone.</p>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => {
                      const shapeIds = Array.from(editor.getCurrentPageShapeIds())
                      if (shapeIds.length > 0) editor.deleteShapes(shapeIds)
                      setShowClearConfirm(false)
                    }}
                    className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-colors rounded-lg py-1.5 text-xs font-bold shadow-inner"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg py-1.5 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {showShapes && (
            <div className="absolute left-full ml-3 top-0 bg-[#111111] border border-slate-800 rounded-2xl p-2 flex flex-col gap-2 shadow-xl z-50">
              <div className="flex gap-2">
                <ToolButton id="rectangle" icon={Square} tooltip="Rectangle" activeTool={activeTool} setTool={setTool} onClick={() => { setTool('rectangle'); setShowShapes(false) }} />
                <ToolButton id="ellipse" icon={Circle} tooltip="Circle" activeTool={activeTool} setTool={setTool} onClick={() => { setTool('ellipse'); setShowShapes(false) }} />
              </div>
              <div className="flex gap-2">
                <ToolButton id="triangle" icon={Triangle} tooltip="Triangle" activeTool={activeTool} setTool={setTool} onClick={() => { setTool('triangle'); setShowShapes(false) }} />
                <ToolButton id="diamond" icon={Diamond} tooltip="Diamond" activeTool={activeTool} setTool={setTool} onClick={() => { setTool('diamond'); setShowShapes(false) }} />
              </div>
              <div className="flex gap-2">
                <ToolButton id="star" icon={Star} tooltip="Star" activeTool={activeTool} setTool={setTool} onClick={() => { setTool('star'); setShowShapes(false) }} />
                <ToolButton id="hexagon" icon={Hexagon} tooltip="Hexagon" activeTool={activeTool} setTool={setTool} onClick={() => { setTool('hexagon'); setShowShapes(false) }} />
              </div>
              <div className="flex gap-2">
                <ToolButton id="cloud" icon={Cloud} tooltip="Cloud" activeTool={activeTool} setTool={setTool} onClick={() => { setTool('cloud'); setShowShapes(false) }} />
                <ToolButton id="line" icon={Minus} tooltip="Line" activeTool={activeTool} setTool={setTool} onClick={() => { setTool('line'); setShowShapes(false) }} />
              </div>
              <div className="flex gap-2">
                <ToolButton id="arrow" icon={ArrowUpRight} tooltip="Connect Arrow" activeTool={activeTool} setTool={setTool} onClick={() => { setTool('arrow'); setShowShapes(false) }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-1 justify-center">
          <ToolButton id="text" icon={Type} tooltip="Text" activeTool={activeTool} setTool={setTool} />
          <ToolButton id="note" icon={StickyNote} tooltip="Sticky Note" activeTool={activeTool} setTool={setTool} />
        </div>

        <div className="flex gap-1 justify-center mt-1">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
          />
          <ActionButton icon={ImageIcon} onClick={() => fileInputRef.current?.click()} tooltip="Insert Image" />
        </div>

        <div className="h-px bg-slate-800 w-full my-1"></div>

        {/* Utilities */}
        <div className="flex gap-1 justify-center">
          <ActionButton 
            icon={Grid3x3} 
            active={isGridMode}
            onClick={handleGridToggle} 
            tooltip={isGridMode ? "Hide Grid" : "Show Grid"} 
          />
          <ActionButton icon={ZoomIn} onClick={handleZoomIn} tooltip="Zoom In" />
        </div>
        <div className="flex gap-1 justify-center">
          <ActionButton icon={ZoomOut} onClick={handleZoomOut} tooltip="Zoom Out" />
          <ActionButton 
            icon={Share2} 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              setToastMessage("Room link copied! Ready to share.")
              setTimeout(() => setToastMessage(null), 3000)
            }} 
            tooltip="Share Room" 
          />
        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#5C55F2] text-white px-4 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Share2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}
    </div>
  )
}
