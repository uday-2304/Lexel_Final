import { useEditor, DefaultColorStyle, DefaultFillStyle, DefaultDashStyle, DefaultSizeStyle, DefaultFontStyle } from 'tldraw'
import { X, Grid3x3, Type, Heading1, Heading2, Heading3, Heading4 } from 'lucide-react'
import { useState, useEffect } from 'react'

const SIZES = [
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
  { id: 'l', label: 'L' },
  { id: 'xl', label: 'XL' },
]

const FONTS = [
  { id: 'draw', label: 'Draw', fontClass: 'font-sans' },
  { id: 'sans', label: 'Sans', fontClass: 'font-sans' },
  { id: 'serif', label: 'Serif', fontClass: 'font-serif' },
  { id: 'mono', label: 'Mono', fontClass: 'font-mono' },
]

const STROKE_COLORS = [
  { id: 'white', bg: 'bg-white' },
  { id: 'black', bg: 'bg-black' },
  { id: 'red', bg: 'bg-red-500' },
  { id: 'orange', bg: 'bg-orange-500' },
  { id: 'green', bg: 'bg-green-500' },
  { id: 'blue', bg: 'bg-blue-500' },
  { id: 'violet', bg: 'bg-blue-500' },
  { id: 'light-red', bg: 'bg-pink-600' },
  { id: 'light-blue', bg: 'bg-blue-600' },
]

const FILL_COLORS = [
  { id: 'none', bg: 'bg-transparent border-2 border-dashed border-slate-600' },
  { id: 'white', bg: 'bg-white' },
  { id: 'black', bg: 'bg-black' },
  { id: 'light-red', bg: 'bg-pink-200' },
  { id: 'light-green', bg: 'bg-green-200' },
  { id: 'light-blue', bg: 'bg-blue-200' },
  { id: 'yellow', bg: 'bg-yellow-200' },
  { id: 'blue', bg: 'bg-blue-400' },
  { id: 'red', bg: 'bg-pink-400' },
  { id: 'violet', bg: 'bg-blue-400' },
]

export default function PropertiesPanel({ onClose }: { onClose: () => void }) {
  const editor = useEditor()
  const [hasSelection, setHasSelection] = useState(false)
  const [strokeColor, setStrokeColor] = useState('black')
  const [fillStyle, setFillStyle] = useState('none')
  const [dashStyle, setDashStyle] = useState('draw')
  const [sizeStyle, setSizeStyle] = useState('m')
  const [fontStyle, setFontStyle] = useState('draw')
  const [opacity, setOpacity] = useState(100)

  useEffect(() => {
    const handleChange = () => {
      const selected = editor.getSelectedShapeIds()
      setHasSelection(selected.length > 0)
      
      if (selected.length > 0) {
        const shared = editor.getSharedStyles()
        setStrokeColor(shared.getAsKnownValue(DefaultColorStyle) || 'black')
        setFillStyle(shared.getAsKnownValue(DefaultFillStyle) || 'none')
        setDashStyle(shared.getAsKnownValue(DefaultDashStyle) || 'draw')
        setSizeStyle(shared.getAsKnownValue(DefaultSizeStyle) || 'm')
        setFontStyle(shared.getAsKnownValue(DefaultFontStyle) || 'draw')
        
        const shape = editor.getShape(selected[0])
        if (shape) setOpacity(Math.round((shape.opacity ?? 1) * 100))
      }
    }
    
    editor.store.listen(handleChange, { source: 'user', scope: 'all' })
    editor.on('change', handleChange)
    handleChange()

    return () => {
      editor.off('change', handleChange)
    }
  }, [editor])

  const updateStroke = (color: string) => {
    editor.setStyleForSelectedShapes(DefaultColorStyle, color as any)
    setStrokeColor(color)
  }

  const updateFill = (fill: string) => {
    editor.setStyleForSelectedShapes(DefaultFillStyle, (fill === 'none' ? 'none' : 'solid') as any)
    // In standard Tldraw, setting a fill color separate from stroke isn't fully supported without custom shapes,
    // so we just set it to solid. If they want a specific fill color, we change the stroke color for now to mimic it,
    // or just leave it as solid using the main color.
    if (fill !== 'none') {
      editor.setStyleForSelectedShapes(DefaultColorStyle, fill as any)
    }
    setFillStyle(fill)
  }

  const updateDash = (dash: string) => {
    editor.setStyleForSelectedShapes(DefaultDashStyle, dash as any)
    setDashStyle(dash)
  }

  const updateSize = (size: string) => {
    editor.setStyleForSelectedShapes(DefaultSizeStyle, size as any)
    setSizeStyle(size)
  }

  const updateFont = (font: string) => {
    editor.setStyleForSelectedShapes(DefaultFontStyle, font as any)
    setFontStyle(font)
  }

  const updateOpacity = (val: number) => {
    setOpacity(val)
    editor.getSelectedShapeIds().forEach(id => {
      const shape = editor.getShape(id)
      if (shape) {
        editor.updateShape({ id, type: shape.type, opacity: val / 100 } as any)
      }
    })
  }

  return (
    <div className="absolute right-20 top-[110px] z-50 w-80 bg-[#111111] border border-slate-800 rounded-2xl shadow-2xl flex flex-col pointer-events-auto h-[calc(100vh-[130px])] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 sticky top-0 bg-[#111111] z-10">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Editor Properties
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      {!hasSelection ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 p-8">
          <Grid3x3 className="w-10 h-10 opacity-20" />
          <p className="text-sm font-medium">Select an object to edit</p>
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-8">
          
          {/* Stroke */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">Stroke / Border</label>
            <div className="flex flex-wrap gap-2">
              {STROKE_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => updateStroke(c.id)}
                  className={`w-8 h-8 rounded-lg ${c.bg} ${strokeColor === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111111]' : 'opacity-80 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          {/* Fill */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">Fill Color</label>
            <div className="flex flex-wrap gap-2">
              {FILL_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => updateFill(c.id)}
                  className={`w-8 h-8 rounded-lg ${c.bg} ${fillStyle === c.id || (c.id !== 'none' && fillStyle !== 'none' && strokeColor === c.id) ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111111]' : 'opacity-80 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          {/* Stroke Style */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">Stroke Style</label>
            <div className="flex gap-2">
              <button 
                onClick={() => updateDash('solid')}
                className={`flex-1 py-2 rounded-lg border ${dashStyle === 'solid' ? 'bg-[#2A344A] border-slate-600' : 'bg-[#111111] border-transparent'} flex justify-center items-center hover:bg-slate-800`}
              >
                <div className="w-6 h-0.5 bg-slate-300 rounded-full" />
              </button>
              <button 
                onClick={() => updateDash('dashed')}
                className={`flex-1 py-2 rounded-lg border ${dashStyle === 'dashed' ? 'bg-[#2A344A] border-slate-600' : 'bg-[#111111] border-transparent'} flex justify-center items-center hover:bg-slate-800`}
              >
                <div className="w-6 border-t-2 border-dashed border-slate-300" />
              </button>
              <button 
                onClick={() => updateDash('dotted')}
                className={`flex-1 py-2 rounded-lg border ${dashStyle === 'dotted' ? 'bg-[#2A344A] border-slate-600' : 'bg-[#111111] border-transparent'} flex justify-center items-center hover:bg-slate-800`}
              >
                <div className="w-6 border-t-2 border-dotted border-slate-300" />
              </button>
            </div>
          </div>

          {/* Size / Thickness */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">Thickness / Size</label>
            <div className="flex gap-2 bg-[#111111] p-1 rounded-xl">
              {SIZES.map(s => (
                <button
                  key={s.id}
                  onClick={() => updateSize(s.id)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-bold ${sizeStyle === s.id ? 'bg-[#2A344A] text-slate-200' : 'text-slate-400 hover:text-slate-200'} transition-colors`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Style */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">Font Style</label>
            <div className="flex gap-2 bg-[#111111] p-1 rounded-xl">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => updateFont(f.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${f.fontClass} ${fontStyle === f.id ? 'bg-[#2A344A] text-slate-200' : 'text-slate-400 hover:text-slate-200'} transition-colors`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Edges */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">Edges</label>
            <div className="flex gap-2 bg-[#111111] p-1 rounded-xl">
              <button className="flex-1 py-1.5 rounded-lg bg-[#2A344A] text-slate-200 text-sm font-medium flex items-center justify-center gap-2">
                <div className="w-3 h-3 border border-slate-400" /> Sharp
              </button>
              <button className="flex-1 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-sm font-medium flex items-center justify-center gap-2">
                <div className="w-3 h-3 border border-slate-400 rounded-full" /> Round
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">Appearance</label>
            <div className="flex gap-2 bg-[#111111] p-1 rounded-xl">
              <button 
                onClick={() => updateDash('solid')}
                className={`flex-1 py-1.5 rounded-lg ${dashStyle !== 'draw' ? 'bg-[#2A344A] text-slate-200' : 'text-slate-400 hover:text-slate-200'} text-sm font-medium flex items-center justify-center gap-2`}
              >
                <Grid3x3 className="w-4 h-4" /> Geometric
              </button>
              <button 
                onClick={() => updateDash('draw')}
                className={`flex-1 py-1.5 rounded-lg ${dashStyle === 'draw' ? 'bg-[#2A344A] text-slate-200' : 'text-slate-400 hover:text-slate-200'} text-sm font-medium flex items-center justify-center gap-2`}
              >
                <div className="w-4 h-4 border-2 border-slate-400 rounded-sm transform rotate-3" /> Hand-drawn
              </button>
            </div>
          </div>

          {/* Opacity */}
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">Opacity</label>
              <span className="text-sm text-slate-400">{opacity}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={opacity}
              onChange={(e) => updateOpacity(parseInt(e.target.value))}
              className="w-full accent-[#5C55F2] bg-slate-700 h-1 rounded-lg appearance-none cursor-pointer"
            />
          </div>

        </div>
      )}
    </div>
  )
}
