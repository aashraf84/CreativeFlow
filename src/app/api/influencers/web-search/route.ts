import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/influencers/web-search
// Searches the internet for influencers matching the query
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const zai = await ZAI.create()

    // Search the web for influencers
    const searchResults = await zai.functions.invoke('web_search', {
      query: `${query.trim()} influencer social media profile`,
      num: 10,
    })

    // Format results as influencer-like objects
    const influencers = (searchResults || []).map((r: {
      url: string
      name: string
      snippet: string
      host_name: string
      favicon?: string
    }, idx: number) => {
      // Try to extract platform from URL
      let platform = 'unknown'
      const url = (r.url || '').toLowerCase()
      if (url.includes('instagram')) platform = 'instagram'
      else if (url.includes('youtube') || url.includes('youtu.be')) platform = 'youtube'
      else if (url.includes('tiktok')) platform = 'tiktok'
      else if (url.includes('twitter') || url.includes('x.com')) platform = 'twitter'
      else if (url.includes('facebook')) platform = 'facebook'
      else if (url.includes('linkedin')) platform = 'linkedin'
      else if (url.includes('pinterest')) platform = 'pinterest'

      // Extract username from URL
      let username = ''
      try {
        const urlObj = new URL(r.url)
        const parts = urlObj.pathname.split('/').filter(Boolean)
        username = parts[0] ? `@${parts[0]}` : ''
      } catch {
        username = ''
      }

      // Extract follower count from snippet if available
      let followers = 0
      const followerMatch = (r.snippet || '').match(/(\d+(?:\.\d+)?)\s*[mkMK]?\s*(?:followers|subscribers|fans)/i)
      if (followerMatch) {
        const num = parseFloat(followerMatch[1])
        const suffix = followerMatch[0].toLowerCase()
        if (suffix.includes('m')) followers = Math.round(num * 1000000)
        else if (suffix.includes('k')) followers = Math.round(num * 1000)
        else followers = Math.round(num)
      }

      return {
        id: `web-${idx}-${Date.now()}`,
        name: r.name || 'Unknown',
        username: username || r.name?.toLowerCase().replace(/\s+/g, '') || '',
        platform,
        followers,
        engagementRate: 0,
        niche: '',
        email: null,
        phone: null,
        notes: r.snippet || '',
        status: 'web_result',
        rate: null,
        contractStart: null,
        contractEnd: null,
        clientId: null,
        campaignId: null,
        client: null,
        campaign: null,
        createdAt: new Date().toISOString(),
        source: 'web',
        sourceUrl: r.url,
        snippet: r.snippet,
        hostName: r.host_name,
        favicon: r.favicon || null,
        isWebResult: true,
      }
    })

    return NextResponse.json({ results: influencers })
  } catch (error) {
    console.error('Influencer web search error:', error)
    return NextResponse.json({ results: [], error: 'Web search failed' }, { status: 500 })
  }
}
