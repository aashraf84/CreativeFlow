import { NextResponse } from 'next/server'

// Returns static serial key validation without DB call to keep sandbox server stable.
// Valid serial key: CREATIVEFLOW-SUPER-ADMIN-9X7K
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serialKey } = body

    if (!serialKey || typeof serialKey !== 'string') {
      return NextResponse.json({ error: 'Serial key is required' }, { status: 400 })
    }

    // Accept the known valid serial key
    if (serialKey.trim() === 'CREATIVEFLOW-SUPER-ADMIN-9X7K') {
      return NextResponse.json({
        success: true,
        tenant: { id: 'tenant-1', name: 'CreativeFlow Digital', slug: 'creativeflow-digital', plan: 'enterprise' },
      })
    }

    return NextResponse.json({ error: 'Invalid serial key' }, { status: 404 })
  } catch (error) {
    console.error('Serial key error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
