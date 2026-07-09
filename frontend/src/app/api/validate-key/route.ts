import { NextResponse } from 'next/server'

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json()
    
    if (!apiKey) {
      return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 })
    }

    // Call Gemini API to validate the key by fetching the models list
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    
    if (res.ok) {
      return NextResponse.json({ valid: true })
    } else {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json({ valid: false, error: errorData.error?.message || 'Invalid API key' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
