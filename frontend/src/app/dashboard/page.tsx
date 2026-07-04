'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Layout, Settings, Trash2, LogOut, Clock } from 'lucide-react'
import { getUserProfile, UserProfile, getBoardHistory, BoardHistory, removeBoardFromHistory, saveToBoardHistory } from '@/lib/store'
import { useTheme } from 'next-themes'

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [history, setHistory] = useState<BoardHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => {
    setMounted(true)
    const p = getUserProfile()
    if (!p) {
      router.push('/')
      return
    }
    setProfile(p)
    setHasApiKey(!!localStorage.getItem('brainforge_gemini_key'))
    sessionStorage.removeItem('isGuestSession')
    
    // Fetch history
    getBoardHistory().then(data => {
      setHistory(data)
      setIsLoading(false)
    })
    
    // Force dark mode for dashboard as requested by the dark aesthetic of the design
    setTheme('dark')
  }, [router, setTheme])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return
    
    const slug = newProjectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'board'
    const id = `${slug}-${Math.random().toString(36).substring(2, 6)}`
    // Save to history with the chosen name
    await saveToBoardHistory({
      id,
      name: newProjectName.trim()
    })
    
    router.push(`/board/${id}`)
  }

  const deleteBoard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await removeBoardFromHistory(id)
    const data = await getBoardHistory()
    setHistory(data)
  }

  const logout = () => {
    localStorage.removeItem('brainforge_user_v2')
    localStorage.removeItem('brainforge_gemini_key')
    router.push('/')
  }

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
                <h1 className="text-2xl font-bold text-white tracking-tight">My Projects</h1>
              </div>
              <p className="text-sm text-slate-400 mt-2 ml-10">
                Manage your local workspaces. All data is stored in your browser.
              </p>
            </div>
            <div className="flex items-center gap-5">
              <button 
                onClick={() => router.push('/?setup=1')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#232D45] border border-slate-700 transition-colors text-sm font-medium text-slate-300"
              >
                <Settings className="w-4 h-4" />
                {hasApiKey ? 'API Configured' : 'Setup API Key'}
              </button>
              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Grid Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            
            {/* Create New Project Card */}
            <button
              onClick={() => setIsCreatingProject(true)}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-[#F7A041] hover:bg-[#F7A041]/10 transition-colors group aspect-video"
            >
              <div className="w-14 h-14 rounded-full bg-[#111111] group-hover:bg-[#F7A041] flex items-center justify-center mb-4 transition-colors">
                <Plus className="w-6 h-6 text-slate-300 group-hover:text-white" />
              </div>
              <h2 className="text-sm font-semibold text-slate-300 group-hover:text-white">Create New Project</h2>
            </button>

            {/* Past Projects Card */}
            <button
              onClick={() => router.push('/projects')}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-[#F7A041] hover:bg-[#F7A041]/10 transition-colors group aspect-video"
            >
              <div className="w-14 h-14 rounded-full bg-[#111111] group-hover:bg-[#F7A041] flex items-center justify-center mb-4 transition-colors">
                <Clock className={`w-6 h-6 text-slate-300 group-hover:text-white ${isLoading ? 'animate-spin' : ''}`} />
              </div>
              <h2 className="text-sm font-semibold text-slate-300 group-hover:text-white">
                {isLoading ? 'Loading...' : 'Past Projects'}
              </h2>
            </button>

          </div>
        </div>
      </div>

      {/* Project Naming Modal */}
      {isCreatingProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] rounded-3xl border border-slate-800 p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Name Your Project</h3>
            <p className="text-sm text-slate-400 mb-6">Give your new whiteboard a memorable name.</p>
            
            <form onSubmit={handleCreateProject}>
              <input
                type="text"
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Marketing Campaign"
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-[#000000] text-white focus:outline-none focus:border-[#F7A041] focus:ring-1 focus:ring-[#F7A041]/50 transition-all text-sm mb-6"
              />
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-[#111111] text-slate-300 font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#F7A041] hover:bg-[#F7A041] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors text-sm shadow-lg shadow-[#F7A041]/20"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] rounded-3xl border border-slate-800 p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Logout</h3>
            <p className="text-sm text-slate-400 mb-8">Are you sure you want to logout? You will need to re-enter your API key to access your projects.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-[#111111] text-slate-300 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="flex-1 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 font-medium transition-colors text-sm shadow-lg shadow-red-500/10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
