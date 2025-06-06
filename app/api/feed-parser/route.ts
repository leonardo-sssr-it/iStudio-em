import { type NextRequest, NextResponse } from "next/server"
import Parser from "rss-parser"

// Anche se non ha risolto prima, lasciarlo non dovrebbe nuocere e potrebbe essere utile in altri contesti.
export const runtime = "nodejs"
// export const dynamic = 'force-dynamic'

type FeedItem = {
  title?: string
  link?: string
  pubDate?: string
  content?: string
  contentSnippet?: string
  isoDate?: string
  creator?: string
}

type ParsedFeed = {
  items: FeedItem[]
  title?: string
}

const parser = new Parser<ParsedFeed, FeedItem>({
  customFields: {
    item: ["content:encoded", "dc:creator"],
  },
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const feedUrl = searchParams.get("url")
  const maxItemsParam = searchParams.get("maxItems")
  const maxItems = maxItemsParam ? Number.parseInt(maxItemsParam, 10) : 10

  if (!feedUrl) {
    return NextResponse.json({ error: "Feed URL is required" }, { status: 400 })
  }

  try {
    console.log(`[API Route] Attempting to fetch feed content from: ${feedUrl}`)

    // Passo 1: Recupera il contenuto del feed usando fetch nativo
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "FeedReaderWidget/1.0 (+http://localhost:3000)", // Alcuni server richiedono un User-Agent
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      // Considera di aggiungere un timeout se necessario, anche se fetch di default ne ha uno
      // signal: AbortSignal.timeout(10000) // Esempio di timeout di 10 secondi (richiede Node 16.14+ o polyfill)
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} while fetching feed: ${response.statusText}`)
    }

    const xmlString = await response.text()
    console.log(`[API Route] Successfully fetched XML content. Length: ${xmlString.length}`)

    // Passo 2: Parsa la stringa XML usando rss-parser
    const feed = await parser.parseString(xmlString)
    console.log(`[API Route] Successfully parsed feed from XML string: ${feed.title || "No title"}`)

    const items = feed.items.slice(0, maxItems).map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      isoDate: item.isoDate,
      content: (item as any)["content:encoded"] || item.content || item.contentSnippet,
      creator: (item as any)["dc:creator"] || item.creator,
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error("[API Route] Error in GET handler:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: `Failed to process feed: ${errorMessage}` }, { status: 500 })
  }
}
