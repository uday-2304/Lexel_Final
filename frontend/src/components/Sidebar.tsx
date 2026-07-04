'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Users, Layout, Share2, LogOut, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBoardHistory, BoardHistory, removeBoardFromHistory } from '@/lib/store'

export default function Sidebar({ boardId, activeUsers = [] }: { boardId?: string, activeUsers?: {id: string, name: string, color: string}[] }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [history, setHistory] = useState<BoardHistory[]>([])
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    getBoardHistory().then(data => setHistory(data))
  }, [])

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleLeave = async () => {
    if (boardId) {
      await removeBoardFromHistory(boardId)
    }
    router.push('/dashboard')
  }

  return (
    <div className="w-72 h-full border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl flex flex-col justify-between p-5 z-50 shadow-xl shadow-slate-200/20 dark:shadow-none transition-colors duration-300">
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-[#000000] flex items-center justify-center shadow-lg border border-[#F7A041]/30">
              <svg width="24" height="16" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h12l4 8h16v4H16l-4-8H0z" fill="#F7A041" />
                <path d="M0 8h12l4 8h16v4H16l-4-8H0z" fill="#F7A041" />
              </svg>
            </div>
            <h1 className="text-xl font-sans font-medium tracking-tight text-slate-800 dark:text-slate-100">
              lexel
            </h1>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Current Board</h2>
            <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#F7A041]/10 border border-[#F7A041]/30">
              <div className="flex items-center gap-3 text-sm font-semibold text-[#F7A041]">
                <span className="w-2 h-2 rounded-full bg-[#F7A041] animate-pulse"></span>
                <span className="truncate w-24">Workspace</span>
              </div>
              <div className="flex gap-1">
                <button onClick={handleShare} className="p-1.5 rounded-lg text-[#F7A041] hover:bg-[#F7A041]/20 transition-colors" title="Share Link">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={handleLeave} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Leave & Remove">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              Multiplayer
              <Users className="w-3.5 h-3.5" />
            </h2>
            <div className="space-y-2 px-1">
              {activeUsers.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No other users online.</p>
              ) : (
                activeUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: u.color }}></span>
                    <span className="font-medium">{u.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              Recent Boards
              <Clock className="w-3.5 h-3.5" />
            </h2>
            <div className="space-y-2 px-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No history.</p>
              ) : (
                history.filter(b => b.id !== boardId).slice(0, 4).map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => router.push(`/board/${b.id}`)}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-[#F7A041] cursor-pointer transition-colors"
                  >
                    <span className="truncate">{b.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-5 border-t border-slate-200 dark:border-slate-800/50 mt-4 shrink-0">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all active:scale-95 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
        >
          {mounted && theme === 'dark' ? (
            <>
              <span>Light Mode</span>
              <Sun className="w-4 h-4 text-orange-400" />
            </>
          ) : (
            <>
              <span>Dark Mode</span>
              <Moon className="w-4 h-4 text-indigo-500" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
