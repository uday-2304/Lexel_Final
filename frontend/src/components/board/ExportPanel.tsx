import { X, Download, FileImage, FileCode, Layers } from 'lucide-react'
import { useEditor, exportAs } from 'tldraw'

export default function ExportPanel({ onClose }: { onClose: () => void }) {
  const editor = useEditor()

  const handleExportPNG = async () => {
    const shapeIds = Array.from(editor.getCurrentPageShapeIds())
    if (shapeIds.length === 0) {
      alert("Canvas is empty!")
      return
    }
    await exportAs(editor, shapeIds, { format: 'png', name: 'whiteboard-export' })
  }

  const handleExportHTML = async () => {
    const shapeIds = Array.from(editor.getCurrentPageShapeIds())
    if (shapeIds.length === 0) {
      alert("Canvas is empty!")
      return
    }

    try {
      const result = await editor.getSvgString(shapeIds, { scale: 1, background: true, darkMode: true, padding: 32 })
      if (!result) {
        alert("Failed to generate SVG data.")
        return
      }
      const { svg } = result
      
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lexel Whiteboard Export</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #111111;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
    }
    svg {
      max-width: 100%;
      height: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border-radius: 12px;
    }
  </style>
</head>
<body>
  ${svg}
</body>
</html>`

      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'whiteboard-export.html'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export HTML:", error)
      alert("Failed to export HTML. Check console for details.")
    }
  }

  return (
    <div className="absolute right-[84px] top-[110px] z-50 w-[340px] bg-[#0E1118] border border-slate-800 rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#0E1118]">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Export & Share
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-6">
        
        {/* Title */}
        <div className="flex items-center gap-3 text-white font-semibold text-lg">
          <Download className="w-5 h-5 text-orange-500" />
          <span>Export & Share</span>
        </div>

        {/* Entire Canvas Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Entire Canvas
          </h3>
          
          <button 
            onClick={handleExportPNG}
            className="w-full bg-[#1A1F2E] hover:bg-[#232A3B] border border-slate-700/50 rounded-xl p-4 flex items-center gap-4 transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#252B42] flex items-center justify-center flex-shrink-0">
              <FileImage className="w-5 h-5 text-[#5C55F2]" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-semibold text-slate-200">Export as PNG</span>
              <span className="text-xs text-slate-500 font-medium">High resolution image (Dark BG)</span>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>

          <button 
            onClick={handleExportHTML}
            className="w-full bg-[#1A1F2E] hover:bg-[#232A3B] border border-slate-700/50 rounded-xl p-4 flex items-center gap-4 transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#3D2825] flex items-center justify-center flex-shrink-0">
              <FileCode className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-semibold text-slate-200">Export as HTML</span>
              <span className="text-xs text-slate-500 font-medium">Embedded web view (Dark BG)</span>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-colors" />
          </button>
        </div>

        <div className="h-px w-full bg-slate-800/80 my-2"></div>

        {/* Current Selection Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Current Selection
          </h3>
          
          <div className="w-full border-2 border-dashed border-slate-800/80 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
            <Layers className="w-6 h-6 text-slate-600" />
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[200px]">
              Select an object or simulation to enable specific export options.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
