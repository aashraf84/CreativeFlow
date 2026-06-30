import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

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
      query: `${query.trim()} influencer profile followers`,
      num: 15,
    })

    // Format results as influencer-like objects
    const influencers = (searchResults || []).map((r: {
      url: string
      name: string
      snippet: string
      host_name: string
      favicon?: string
      date?: string
    }, idx: number) => {
      // Detect platform from URL
      let platform = 'web'
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
        if (parts.length > 0 && parts[0] !== 'reel' && parts[0] !== 'watch' && parts[0] !== 'p') {
          username = `@${parts[0]}`
        }
      } catch {
        username = ''
      }

      // Extract follower count from snippet (try multiple patterns)
      let followers = 0
      const snippet = r.snippet || ''
      // Pattern 1: "412K followers" or "1.3M followers"
      const m1 = snippet.match(/(\d+(?:[.,]\d+)?)\s*([KkMm])\s*followers/i)
      if (m1) {
        const num = parseFloat(m1[1].replace(',', '.'))
        const suffix = m1[2].toLowerCase()
        if (suffix === 'm') followers = Math.round(num * 1000000)
        else if (suffix === 'k') followers = Math.round(num * 1000)
      }
      // Pattern 2: "1,234,567 followers"
      if (followers === 0) {
        const m2 = snippet.match(/(\d{1,3}(?:,\d{3})+)\s*followers/i)
        if (m2) followers = parseInt(m2[1].replace(/,/g, ''))
      }
      // Pattern 3: "412K subscribers"
      if (followers === 0) {
        const m3 = snippet.match(/(\d+(?:[.,]\d+)?)\s*([KkMm])\s*subscribers/i)
        if (m3) {
          const num = parseFloat(m3[1].replace(',', '.'))
          const suffix = m3[2].toLowerCase()
          if (suffix === 'm') followers = Math.round(num * 1000000)
          else if (suffix === 'k') followers = Math.round(num * 1000)
        }
      }

      // Clean up name (remove "• Instagram photos and videos" etc.)
      let cleanName = r.name || 'Unknown'
      cleanName = cleanName.replace(/\s*•\s*Instagram.*$/i, '')
      cleanName = cleanName.replace(/\s*•\s*YouTube.*$/i, '')
      cleanName = cleanName.replace(/\s*-\s*Instagram.*$/i, '')
      cleanName = cleanName.replace(/\s*\|\s*Instagram.*$/i, '')
      cleanName = cleanName.replace(/\s*-\s*YouTube.*$/i, '')
      cleanName = cleanName.replace(/\s*\|\s*YouTube.*$/i, '')
      cleanName = cleanName.replace(/\s*-\s*TikTok.*$/i, '')
      if (cleanName.length > 50) cleanName = cleanName.substring(0, 50)

      return {
        id: `web-${idx}-${Date.now()}`,
        name: cleanName,
        username: username,
        platform: platform,
        followers: followers,
        engagementRate: 0,
        niche: '',
        email: null,
        phone: null,
        notes: snippet.substring(0, 200),
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
        snippet: snippet,
        hostName: r.host_name,
        favicon: r.favicon || null,
        isWebResult: true,
      }
    })

    return NextResponse.json({ results: influencers })
  } catch (error) {
    console.error('Influencer web search error:', error)
    return NextResponse.json({ results: [], error: 'Web search failed: ' + (error as Error).message }, { status: 500 })
  }
}
