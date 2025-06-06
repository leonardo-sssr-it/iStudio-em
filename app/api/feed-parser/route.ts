import { type NextRequest, NextResponse } from "next/server"
import Parser from "rss-parser"

// Forzare il runtime Node.js per questo route handler
export const runtime = "nodejs"
// export const dynamic = 'force-dynamic' // Opzionale: se vuoi assicurarti che non venga mai cachato staticamente

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
  title?: string // Aggiunto per logging
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
    console.log(`[Node.js Runtime] Fetching feed from: ${feedUrl}`)
    const feed = await parser.parseURL(feedUrl)
    console.log(`[Node.js Runtime] Successfully parsed feed: ${feed.title || "No title"}`)

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
    console.error("[Node.js Runtime] Error fetching or parsing feed:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: `Failed to fetch or parse feed: ${errorMessage}` }, { status: 500 })
  }
}
