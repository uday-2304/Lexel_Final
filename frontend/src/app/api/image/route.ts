import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const encodedQuery = encodeURIComponent(prompt);
    
    if (mode === 'Icon Generator') {
      let searchRes = await fetch(`https://api.iconify.design/search?query=${encodedQuery}&limit=1&prefixes=lucide,ph,tabler,material-symbols,mdi,fa6-regular,fluent`);
      let searchData = searchRes.ok ? await searchRes.json() : { icons: [] };

      // Fallback: if no icon found, try searching just the most meaningful word (e.g. last word)
      if (!searchData.icons || searchData.icons.length === 0) {
        const words = prompt.split(' ').filter((w: string) => w.length > 2);
        const fallbackWord = words.pop();
        if (fallbackWord) {
          searchRes = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(fallbackWord)}&limit=1&prefixes=lucide,ph,tabler,material-symbols,mdi,fa6-regular,fluent`);
          searchData = searchRes.ok ? await searchRes.json() : { icons: [] };
        }
      }

      if (searchData.icons && searchData.icons.length > 0) {
        // Enforce strict limit of 1 icon manually in case Iconify API ignores the limit query param
        const topIcon = searchData.icons.slice(0, 1);
        const svgPromises = topIcon.map(async (iconName: string) => {
          const [prefix, name] = iconName.split(':');
          // Enforce white color via Iconify API
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

    // Mode 2: Image Generator (AI, highly accurate to user text)
    const enhancedPrompt = `${prompt}, highly detailed, vibrant, high resolution`;
    const cleanPrompt = prompt.trim();
    
    // Multi-tier candidate endpoints
    const candidateUrls = [
      `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=768&height=768&nologo=true&model=flux&seed=${Math.floor(Math.random() * 100000)}`,
      `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=768&height=768&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 100000)}`,
      `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`,
      `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=768&q=80` // Reliable beautiful abstract fallback if all AI servers fail
    ];

    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    };

    let successfulResponse: Response | null = null;

    for (const url of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout per source

        const res = await fetch(url, {
          headers: browserHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const cType = res.headers.get('Content-Type') || '';
          if (cType.startsWith('image/') || cType.includes('octet-stream')) {
            successfulResponse = res;
            break;
          }
        }
      } catch (err: any) {
        console.warn(`Image generation source failed (${url}):`, err.message);
      }
    }

    if (!successfulResponse) {
      return NextResponse.json({ error: 'AI Image Server is temporarily busy. Please try again with a shorter description.' }, { status: 500 });
    }

    const contentType = successfulResponse.headers.get('Content-Type') || 'image/jpeg';
    const arrayBuffer = await successfulResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("Image API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
