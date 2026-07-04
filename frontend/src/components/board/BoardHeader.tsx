import { useState, useEffect } from 'react'
import { getBoardHistory } from '@/lib/store'
import { LayoutGrid } from 'lucide-react'
import Link from 'next/link'

export default function BoardHeader({ boardId }: { boardId: string }) {
  const [boardName, setBoardName] = useState('Untitled')

  useEffect(() => {
    getBoardHistory().then(history => {
      const board = history.find(b => b.id === boardId)
      if (board) setBoardName(board.name)
    })
  }, [boardId])

  return (
    <div className="absolute top-0 left-0 w-full h-[70px] bg-transparent z-50 flex items-start pointer-events-none">
      
      {/* Left Navbar Area - Floating Tab */}
      <div className="mt-4 ml-4 pointer-events-auto">
        <div className="h-[48px] rounded-2xl bg-[#0A0A0A]/90 backdrop-blur-md border border-slate-800/80 pl-2 pr-6 flex items-center gap-3 shadow-2xl">
          
          {/* Dashboard Button */}
          <Link href="/dashboard" className="p-2 rounded-xl bg-transparent hover:bg-white/5 transition-colors text-slate-400 hover:text-[#F7A041]" title="Go to Dashboard">
            <LayoutGrid className="w-4 h-4" />
          </Link>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-slate-800"></div>

          {/* Logo & Text */}
          <div className="flex items-center gap-2.5">
            <svg width="22" height="14" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h12l4 8h16v4H16l-4-8H0z" fill="#F7A041" />
              <path d="M0 8h12l4 8h16v4H16l-4-8H0z" fill="#F7A041" />
            </svg>
            <h1 className="text-[19px] font-sans font-semibold text-white leading-none tracking-tight">
              lexel
            </h1>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-slate-800"></div>

          {/* Project Name */}
          <div className="flex items-center px-1">
            <span className="text-[13px] text-slate-300 font-medium tracking-wide truncate max-w-[180px]">
              {boardId.startsWith('board-guest-') ? 'Sandbox' : boardName}
            </span>
          </div>
          
        </div>
      </div>

    </div>
  )
}
