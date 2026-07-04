export interface UserProfile {
  name: string
  color: string
}

export interface BoardHistory {
  id: string
  name: string
  lastOpened: number
}

const USER_KEY = 'brainforge_user_v2'

export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(USER_KEY)
  return data ? JSON.parse(data) : null
}

export function saveUserProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(profile))
}

export async function getBoardHistory(): Promise<BoardHistory[]> {
  if (typeof window === 'undefined') return []
  const apiKey = localStorage.getItem('brainforge_gemini_key')
  if (!apiKey) return []
  try {
    const res = await fetch(`/api/projects?apiKey=${encodeURIComponent(apiKey)}`, { cache: 'no-store' })
    const data = await res.json()
    return data.projects || []
  } catch {
    return []
  }
}

export async function saveToBoardHistory(board: Omit<BoardHistory, 'lastOpened'>) {
  if (typeof window === 'undefined') return
  const apiKey = localStorage.getItem('brainforge_gemini_key')
  if (!apiKey) return
  
  try {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, board })
    })
  } catch {}
}

export async function removeBoardFromHistory(boardId: string) {
  if (typeof window === 'undefined') return
  const apiKey = localStorage.getItem('brainforge_gemini_key')
  if (!apiKey) return
  
  try {
    await fetch(`/api/projects?apiKey=${encodeURIComponent(apiKey)}&id=${encodeURIComponent(boardId)}`, {
      method: 'DELETE'
    })
  } catch {}
}

export function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}
