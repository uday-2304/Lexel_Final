'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Whiteboard from '@/components/Whiteboard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getUserProfile, saveToBoardHistory, UserProfile, getBoardHistory } from '@/lib/store'
import { useYjsStore } from '@/hooks/useYjsStore'
import { useTheme } from 'next-themes'

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.id as string
  const [mounted, setMounted] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const { setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    setTheme('dark')
    const profile = getUserProfile() || { name: 'Guest', color: '#64748B' }
    setUserProfile(profile)

    const apiKey = localStorage.getItem('brainforge_gemini_key')
    const isGuestSession = sessionStorage.getItem('isGuestSession') === 'true'

    if (!apiKey && !isGuestSession) {
      router.push(`/?redirect=/board/${boardId}`)
      return
    }

    // Only save to history if they are NOT on a guest board
    if (!boardId.startsWith('board-guest-')) {
      getBoardHistory().then(history => {
        const existing = history.find(b => b.id === boardId)
        if (existing) {
          saveToBoardHistory(existing)
        } else {
          saveToBoardHistory({
            id: boardId,
            name: `Workspace: ${boardId.slice(0, 8)}`,
          })
        }
      })
    }
  }, [boardId])

  const { storeWithStatus, activeUsers } = useYjsStore({
    roomId: boardId,
    hostUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234',
    userProfile: userProfile || undefined
  })

  if (!mounted) return null

  return (
    <main className="w-full h-screen flex overflow-hidden bg-[#000000] transition-colors duration-300">
      <div className="flex-1 relative">
        <ErrorBoundary>
          <Whiteboard storeWithStatus={storeWithStatus} userProfile={userProfile} boardId={boardId} />
        </ErrorBoundary>
      </div>
    </main>
  )
}
