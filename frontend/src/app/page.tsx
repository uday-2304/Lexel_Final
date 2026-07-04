'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Key, X, ShieldCheck, ArrowRight } from 'lucide-react'
import { getUserProfile, saveUserProfile, generateRandomColor } from '@/lib/store'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  const [isSetupMode, setIsSetupMode] = useState(false)

  useEffect(() => {
    const isSetup = typeof window !== 'undefined' && window.location.search.includes('setup=1')
    setIsSetupMode(isSetup)
    
    let key: string | null = null
    if (typeof window !== 'undefined') {
      key = localStorage.getItem('brainforge_gemini_key')
    }
    const profile = getUserProfile()
    
    // Only auto-redirect if they have BOTH a profile AND an API key (unless setup mode)
    if (profile && key && !isSetup) {
      const searchParams = new URLSearchParams(window.location.search)
      const redirect = searchParams.get('redirect')
      if (redirect) {
        router.push(redirect)
      } else {
        router.push('/dashboard')
      }
    } else if (profile) {
      setName(profile.name)
      if (key) setApiKey(key)
    }
  }, [router])

  const handleSkip = () => {
    sessionStorage.setItem('isGuestSession', 'true')
    // Generate a random board ID for the guest and go straight to it
    const guestId = 'board-guest-' + Math.random().toString(36).substring(2, 9)
    router.push(`/board/${guestId}`)
  }

  const handleEnableAI = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!name.trim()) {
      setErrorMsg("Please enter a name!")
      return
    }
    
    if (!apiKey.trim()) {
      setErrorMsg("Please enter a Gemini API Key to enable AI features!")
      return
    }

    setIsValidating(true)

    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      })

      const data = await res.json()

      if (!data.valid) {
        setErrorMsg(data.error || 'Invalid API Key. Please check and try again.')
        setIsValidating(false)
        return
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('brainforge_gemini_key', apiKey.trim())
        sessionStorage.removeItem('isGuestSession')
      }

      saveUserProfile({
        name: name.trim(),
        color: generateRandomColor(),
      })
      
      const searchParams = new URLSearchParams(window.location.search)
      const redirect = searchParams.get('redirect')
      if (redirect) {
        router.push(redirect)
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error("Validation error:", err)
      setErrorMsg(err.message || 'Failed to validate API key. Please try again.')
      setIsValidating(false)
    }
  }

  const handleClose = () => {
    if (isSetupMode) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060913] p-4 font-sans text-white">
      <div className="relative max-w-[500px] w-full bg-[#0A0A0A] rounded-3xl shadow-2xl border border-slate-800/60 p-8">
        
        {/* Close Button */}
        {isSetupMode && (
          <button 
            onClick={handleClose}
            className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="w-16 h-16 rounded-full border border-[#F7A041]/40 bg-[#F7A041]/10 flex items-center justify-center mb-6">
            <Key className="w-7 h-7 text-[#A06CA0]" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-white mb-3">
            Unlock AI Powers
          </h1>
          <p className="text-slate-400 text-center text-[15px] leading-relaxed px-4">
            Enter your name and a Google Gemini API Key to enable generative features, code analysis, and simulation building.
          </p>
        </div>

        <form onSubmit={handleEnableAI} className="space-y-5">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-4 rounded-xl flex items-start gap-2 shadow-inner">
              <span className="font-bold text-red-500 shrink-0 mt-0.5">!</span>
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}
          {/* Name Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              YOUR NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Creative Fox"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-[#000000] text-white focus:outline-none focus:border-[#F7A041] focus:ring-1 focus:ring-[#F7A041]/50 transition-all text-[15px]"
              required
            />
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              GEMINI API KEY
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3.5 rounded-xl border border-[#F7A041]/60 bg-[#000000] text-white focus:outline-none focus:border-[#F7A041] focus:ring-1 focus:ring-[#F7A041] transition-all font-mono text-[15px] placeholder-slate-600"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-8">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-3.5 px-4 rounded-xl border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 font-medium transition-colors text-[15px]"
            >
              Skip (Whiteboard Only)
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className={`flex-1 py-3.5 px-4 rounded-xl hover:bg-[#F7A041] text-white font-medium transition-all shadow-lg flex items-center justify-center gap-2 text-[15px] ${isValidating ? 'bg-[#3b2749] opacity-70 cursor-not-allowed' : 'bg-[#49315A] active:scale-[0.98] shadow-[#F7A041]/20'}`}
            >
              {isValidating ? 'Validating...' : (
                <>Enable AI <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>

        {/* Security Alert */}
        <div className="mt-6 p-4 rounded-xl border border-slate-800/80 bg-[#161D2D] flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-slate-400 leading-relaxed pr-2">
            Your API key is stored locally in your browser and used directly with the Google Gemini API. It is never sent to our servers.
          </p>
        </div>

      </div>
    </div>
  )
}
