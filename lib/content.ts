import { Innertube } from 'youtubei.js'

function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
  return youtubeRegex.test(url)
}

function getVideoId(url: string): string | null {
  const patterns = [
    /(?:v=|\/)([a-zA-Z0-9_-]{11})/, // Standard `?v=` or `/`
    /^([a-zA-Z0-9_-]{11})$/         // Just the ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export async function getContentText(url: string): Promise<string> {
  if (isYouTubeUrl(url)) {
    const videoId = getVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL: Could not extract video ID.')
    }
    const youtube = await Innertube.create()
    const info = await youtube.getBasicInfo(videoId)
    return info?.basic_info?.short_description || ''
  } else {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }
    const html = await response.text()
    // Basic HTML cleaning
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000) // Limit content size to avoid overly large payloads
  }
}
