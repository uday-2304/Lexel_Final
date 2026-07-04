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
  const apiKey = localStorage.getItem('brainforge_gemini_key') || 'guest'
  try {
    const data = localStorage.getItem(`lexel_projects_${apiKey}`)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export async function saveToBoardHistory(board: Omit<BoardHistory, 'lastOpened'>) {
  if (typeof window === 'undefined') return
  const apiKey = localStorage.getItem('brainforge_gemini_key') || 'guest'
  
  try {
    const history = await getBoardHistory()
    const existingIndex = history.findIndex(b => b.id === board.id)
    
    if (existingIndex >= 0) {
      history[existingIndex] = { ...history[existingIndex], ...board, lastOpened: Date.now() }
    } else {
      history.unshift({ ...board, lastOpened: Date.now() })
    }
    
    // Keep only last 15 projects
    const trimmed = history.slice(0, 15)
    localStorage.setItem(`lexel_projects_${apiKey}`, JSON.stringify(trimmed))
  } catch {}
}

export async function removeBoardFromHistory(boardId: string) {
  if (typeof window === 'undefined') return
  const apiKey = localStorage.getItem('brainforge_gemini_key') || 'guest'
  
  try {
    const history = await getBoardHistory()
    const filtered = history.filter(b => b.id !== boardId)
    localStorage.setItem(`lexel_projects_${apiKey}`, JSON.stringify(filtered))
  } catch {}
}

export function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}
