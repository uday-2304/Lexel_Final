import { NextResponse } from 'next/server';

export const maxDuration = 60;

// Helper to generate a stylish fallback SVG banner when third-party servers are unreachable
function generateFallbackSvg(prompt: string): string {
  const cleanTitle = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
  const escapedTitle = cleanTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Pick gradient colors based on prompt hash
  const colors = [
    ['#3B82F6', '#8B5CF6', '#EC4899'],
    ['#06B6D4', '#3B82F6', '#6366F1'],
    ['#10B981', '#059669', '#047857'],
    ['#F59E0B', '#EF4444', '#7C3AED'],
    ['#6366F1', '#EC4899', '#F43F5E']
  ];
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) hash += prompt.charCodeAt(i);
  const palette = colors[Math.abs(hash) % colors.length];

  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090D16" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette[0]}" />
      <stop offset="50%" stop-color="${palette[1]}" />
      <stop offset="100%" stop-color="${palette[2]}" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="60" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="1024" height="1024" fill="url(#bgGrad)" rx="32" />
  
  <!-- Ambient background glow circles -->
  <circle cx="250" cy="250" r="180" fill="${palette[0]}" opacity="0.25" filter="url(#glow)" />
  <circle cx="780" cy="780" r="220" fill="${palette[1]}" opacity="0.2" filter="url(#glow)" />
  <circle cx="800" cy="200" r="140" fill="${palette[2]}" opacity="0.15" filter="url(#glow)" />

  <!-- Center Card -->
  <rect x="92" y="160" width="840" height="704" rx="28" fill="#13192B" fill-opacity="0.8" stroke="url(#accentGrad)" stroke-width="2" />
  
  <!-- Decorative badge -->
  <rect x="132" y="210" width="160" height="40" rx="20" fill="${palette[0]}" fill-opacity="0.2" stroke="${palette[0]}" stroke-width="1.5" />
  <text x="212" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="${palette[0]}" text-anchor="middle" letter-spacing="1.5">LEXEL ASSET</text>

  <!-- Prompt Text -->
  <text x="132" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="800" fill="#FFFFFF" width="760">
    <tspan x="132" dy="0">${escapedTitle}</tspan>
  </text>

  <!-- Visual artwork icon in center -->
  <g transform="translate(432, 450)">
    <circle cx="80" cy="80" r="70" fill="url(#accentGrad)" opacity="0.9" />
    <path d="M55 95 L75 65 L95 90 L105 78 L120 95 Z" fill="#FFFFFF" />
    <circle cx="70" cy="60" r="8" fill="#FFFFFF" />
  </g>

  <!-- Footer Info -->
  <text x="512" y="800" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#64748B" text-anchor="middle">
    Generated with Lexel Creative Studio
  </text>
</svg>`;
}

export async function POST(req: Request) {
  try {
    const { prompt, mode, apiKey } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const encodedQuery = encodeURIComponent(prompt.trim());
    
    // --- MODE 1: ICON GENERATOR ---
    if (mode === 'Icon Generator') {
      let searchRes = await fetch(`https://api.iconify.design/search?query=${encodedQuery}&limit=1&prefixes=lucide,ph,tabler,material-symbols,mdi,fa6-regular,fluent`);
      let searchData = searchRes.ok ? await searchRes.json() : { icons: [] };

      // Fallback: search individual key terms
      if (!searchData.icons || searchData.icons.length === 0) {
        const words = prompt.trim().split(' ').filter((w: string) => w.length > 2);
        const fallbackWord = words.pop();
        if (fallbackWord) {
          searchRes = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(fallbackWord)}&limit=1&prefixes=lucide,ph,tabler,material-symbols,mdi,fa6-regular,fluent`);
          searchData = searchRes.ok ? await searchRes.json() : { icons: [] };
        }
      }

      if (searchData.icons && searchData.icons.length > 0) {
        const topIcon = searchData.icons.slice(0, 1);
        const svgPromises = topIcon.map(async (iconName: string) => {
          const [prefix, name] = iconName.split(':');
          const svgRes = await fetch(`https://api.iconify.design/${prefix}/${name}.svg?color=white`);
          if (svgRes.ok) {
            return await svgRes.text();
          }
          return null;
        });

        const svgs = (await Promise.all(svgPromises)).filter(Boolean);
        if (svgs.length > 0) {
          return NextResponse.json({ icons: svgs }, { status: 200 });
        }
      }
      
      return NextResponse.json({ error: 'No icon found for this query' }, { status: 404 });
    }

    // --- MODE 2: IMAGE GENERATOR ---
    const cleanPrompt = prompt.trim();
    const key = apiKey || process.env.GEMINI_API_KEY;

    let successfulBuffer: Buffer | null = null;
    let successfulContentType = 'image/jpeg';

    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    };

    // TIER 1: Google Imagen 3 (if Gemini key provided)
    if (key && !successfulBuffer) {
      try {
        const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`;
        const imagenRes = await fetch(imagenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: cleanPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: '1:1',
              outputMimeType: 'image/jpeg',
            },
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (imagenRes.ok) {
          const data = await imagenRes.json();
          const base64Data = data?.predictions?.[0]?.bytesBase64Encoded;
          if (base64Data) {
            const buffer = Buffer.from(base64Data, 'base64');
            successfulBuffer = buffer;
            successfulContentType = 'image/jpeg';
          }
        }
      } catch (err: any) {
        console.warn('Google Imagen generation tier skipped:', err?.message || err);
      }
    }

    // TIER 2: Wikimedia Commons High-Resolution Image Search
    if (!successfulBuffer) {
      try {
        const wikiSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanPrompt)}&gsrlimit=3&prop=imageinfo&iiprop=url|mime&format=json`;
        const wikiRes = await fetch(wikiSearchUrl, {
          headers: { 'User-Agent': 'LexelBot/1.0 (https://lexel.app; contact@lexel.app)' },
          signal: AbortSignal.timeout(6000),
        });

        if (wikiRes.ok) {
          const data = await wikiRes.json();
          const pages = Object.values(data?.query?.pages || {}) as any[];
          const bestImg = pages.find((p) => {
            const mime = p.imageinfo?.[0]?.mime || '';
            return mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp');
          })?.imageinfo?.[0];

          if (bestImg?.url) {
            const imgRes = await fetch(bestImg.url, {
              headers: { 'User-Agent': 'LexelBot/1.0 (https://lexel.app; contact@lexel.app)' },
              signal: AbortSignal.timeout(8000),
            });
            if (imgRes.ok) {
              const ab = await imgRes.arrayBuffer();
              if (ab.byteLength > 1000) {
                successfulBuffer = Buffer.from(ab);
                successfulContentType = bestImg.mime || 'image/jpeg';
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('Wikimedia search skipped:', err.message);
      }
    }

    // TIER 3: LoremFlickr High-Resolution Contextual Photo
    if (!successfulBuffer) {
      try {
        const keywords = cleanPrompt
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .trim()
          .split(/\s+/)
          .slice(0, 3)
          .join(',');

        const flickrUrl = `https://loremflickr.com/1024/1024/${encodeURIComponent(keywords || 'concept')}`;
        const flickrRes = await fetch(flickrUrl, {
          headers: browserHeaders,
          signal: AbortSignal.timeout(6000),
        });

        if (flickrRes.ok && flickrRes.headers.get('Content-Type')?.startsWith('image/')) {
          const ab = await flickrRes.arrayBuffer();
          if (ab.byteLength > 1000) {
            successfulBuffer = Buffer.from(ab);
            successfulContentType = flickrRes.headers.get('Content-Type') || 'image/jpeg';
          }
        }
      } catch (err: any) {
        console.warn('Flickr fallback skipped:', err.message);
      }
    }

    // TIER 4: Guaranteed Zero-Failure SVG Generation
    if (!successfulBuffer) {
      const svgContent = generateFallbackSvg(cleanPrompt);
      successfulBuffer = Buffer.from(svgContent, 'utf-8');
      successfulContentType = 'image/svg+xml';
    }

    return new NextResponse(new Uint8Array(successfulBuffer), {
      status: 200,
      headers: {
        'Content-Type': successfulContentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("Image API Error:", error);
    const fallbackSvg = generateFallbackSvg('Generated Asset');
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
