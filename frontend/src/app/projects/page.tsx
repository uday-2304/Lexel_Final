'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, Clock, Trash2, ArrowLeft, Search } from 'lucide-react'
import { getUserProfile, UserProfile, getBoardHistory, BoardHistory, removeBoardFromHistory } from '@/lib/store'
import { useTheme } from 'next-themes'

function formatRelativeTime(dateInput: string | number) {
  const date = new Date(dateInput)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}

export default function ProjectsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [history, setHistory] = useState<BoardHistory[]>([])
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { setTheme } = useTheme()
  const router = useRouter()

  const [boardToDelete, setBoardToDelete] = useState<string | null>(null)

  useEffect(() => {
    const p = getUserProfile()
    if (!p) {
      router.push('/')
      return
    }
    setProfile(p)
    getBoardHistory().then(data => {
      setHistory(data)
      
      // Load thumbnails
      const thumbs: Record<string, string> = {}
      data.forEach(board => {
        const thumb = localStorage.getItem(`lexel_thumb_${board.id}`)
        if (thumb) {
          thumbs[board.id] = thumb
        }
      })
      setThumbnails(thumbs)
      
      setIsLoading(false)
    })
    
    // Force dark mode for aesthetic consistency
    setTheme('dark')
  }, [router, setTheme])

  const deleteBoard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setBoardToDelete(id)
  }

  const confirmDelete = async () => {
    if (!boardToDelete) return
    await removeBoardFromHistory(boardToDelete)
    const data = await getBoardHistory()
    setHistory(data)
    setBoardToDelete(null)
  }

  const filteredHistory = history.filter(board => 
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#000000] p-8 flex items-center justify-center text-white font-sans relative">
      
      {/* App Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#F7A041] flex items-center justify-center shadow-lg shadow-[#F7A041]/20">
          <Layout className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-white">lexel</span>
      </div>

      <div className="w-full max-w-5xl">
        
        {/* Main Dashboard Container */}
        <div className="rounded-2xl border border-slate-800 bg-[#0A0A0A] p-8 shadow-2xl">
          
          {/* Header Section */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-8 mb-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <Layout className="w-7 h-7 text-[#F7A041]" />
                <h1 className="text-2xl font-bold text-white tracking-tight">Past Projects</h1>
              </div>
              <p className="text-sm text-slate-400 mt-2 ml-10">
                Manage your local workspaces. All data is stored in your browser.
              </p>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#232D45] border border-slate-700 transition-colors text-sm font-medium text-slate-300"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-800 bg-[#0A0A0A] text-white focus:outline-none focus:border-[#F7A041] transition-colors"
            />
          </div>

          {/* Grid Section */}
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-8 h-8 rounded-full border-2 border-t-[#F7A041] border-r-[#F7A041] border-b-transparent border-l-transparent animate-spin mx-auto mb-4"></div>
              Loading your projects...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              <Clock className="w-12 h-12 mb-4 text-slate-700" />
              <p>No past projects found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredHistory.map((board) => (
                <div
                  key={board.id}
                  onClick={() => router.push(`/board/${board.id}`)}
                  className="flex flex-col rounded-2xl border border-slate-800/60 bg-[#0B101D] hover:border-slate-500 hover:shadow-xl transition-all cursor-pointer aspect-[4/3] overflow-hidden group"
                >
                  {/* Preview Area */}
                  <div className="flex-1 min-h-0 w-full relative bg-[#121212]">
                    {thumbnails[board.id] && (
                      <img 
                        src={thumbnails[board.id]} 
                        alt="Board Thumbnail"
                        className="absolute inset-0 w-full h-full object-contain p-6 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                    )}
                  </div>
                  
                  {/* Card Footer */}
                  <div className="px-3 py-1.5 bg-[#0A0A0A] flex items-center justify-between border-t border-slate-800/80 z-10 relative">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-medium text-[13px] text-slate-100 tracking-wide truncate max-w-[170px]">{board.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-[#F7A041]/90 lowercase">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(board.lastOpened)}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => deleteBoard(e, board.id)}
                      className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-slate-800"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {boardToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] rounded-3xl border border-slate-800 p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Delete Project</h3>
            <p className="text-sm text-slate-400 mb-8">Are you sure you want to delete this project? This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setBoardToDelete(null)}
                className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-[#111111] text-slate-300 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 font-medium transition-colors text-sm shadow-lg shadow-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
