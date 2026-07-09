import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const encodedQuery = encodeURIComponent(prompt);
    
    if (mode === 'Icon Generator') {
      let searchRes = await fetch(`https://api.iconify.design/search?query=${encodedQuery}&limit=1&prefixes=lucide,ph,tabler,material-symbols,mdi,fa6-regular,fluent`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
      let searchData = (searchRes && searchRes.ok) ? await searchRes.json() : { icons: [] };

      // Fallback: if no icon found, try searching just the most meaningful word (e.g. last word)
      if (!searchData.icons || searchData.icons.length === 0) {
        const words = prompt.split(' ').filter((w: string) => w.length > 2);
        const fallbackWord = words.pop();
        if (fallbackWord) {
          searchRes = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(fallbackWord)}&limit=1&prefixes=lucide,ph,tabler,material-symbols,mdi,fa6-regular,fluent`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
          searchData = (searchRes && searchRes.ok) ? await searchRes.json() : { icons: [] };
        }
      }

      if (searchData.icons && searchData.icons.length > 0) {
        // Enforce strict limit of 1 icon manually in case Iconify API ignores the limit query param
        const topIcon = searchData.icons.slice(0, 1);
        const svgPromises = topIcon.map(async (iconName: string) => {
          const [prefix, name] = iconName.split(':');
          // Enforce white color via Iconify API
          const svgRes = await fetch(`https://api.iconify.design/${prefix}/${name}.svg?color=white`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
          if (svgRes && svgRes.ok) {
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
    const enhancedPrompt = `${prompt}, highly detailed, realistic photography, 8k resolution`;
    const encodedImageQuery = encodeURIComponent(enhancedPrompt);
    
    // Add random seed to bypass cache and prevent sticky 500 errors
    const randomSeed = Math.floor(Math.random() * 100000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedImageQuery}?width=512&height=512&nologo=true&seed=${randomSeed}`;

    let response = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) }).catch(() => null);
    
    // Simple retry fallback if the server is overloaded
    if (!response || !response.ok) {
       console.warn("Primary image fetch failed, retrying with new seed...");
       const fallbackSeed = Math.floor(Math.random() * 100000);
       const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedImageQuery}?width=512&height=512&nologo=true&seed=${fallbackSeed}`;
       response = await fetch(fallbackUrl, { signal: AbortSignal.timeout(15000) }).catch(() => null) as any;
    }

    if (!response || !response.ok) {
      return NextResponse.json({ error: 'AI Image Server is temporarily overloaded. Please try again in a few seconds.' }, { status: 500 });
    }

    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
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
