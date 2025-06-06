import { type NextRequest, NextResponse } from "next/server"
import Parser from "rss-parser"

// Definisci un tipo per gli elementi del feed per maggiore chiarezza
type FeedItem = {
  title?: string
  link?: string
  pubDate?: string
  content?: string
  contentSnippet?: string
  isoDate?: string
  creator?: string
  // Aggiungi altri campi se necessario
}

type ParsedFeed = {
  items: FeedItem[]
  // Aggiungi altri campi del feed se necessario (es. feed.title)
}

const parser = new Parser<ParsedFeed, FeedItem>({
  customFields: {
    item: ["content:encoded", "dc:creator"], // Assicurati che 'content:encoded' sia richiesto se presente nel feed
  },
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const feedUrl = searchParams.get("url")
  const maxItemsParam = searchParams.get("maxItems")
  const maxItems = maxItemsParam ? Number.parseInt(maxItemsParam, 10) : 10 // Default a 10 items

  if (!feedUrl) {
    return NextResponse.json({ error: "Feed URL is required" }, { status: 400 })
  }

  try {
    console.log(`Fetching feed from: ${feedUrl}`)
    const feed = await parser.parseURL(feedUrl)
    console.log(`Successfully parsed feed: ${feed.title || "No title"}`)

    const items = feed.items.slice(0, maxItems).map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      isoDate: item.isoDate,
      // Usa 'content:encoded' se disponibile, altrimenti 'content', poi 'contentSnippet'
      content: (item as any)["content:encoded"] || item.content || item.contentSnippet,
      creator: (item as any)["dc:creator"] || item.creator,
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching or parsing feed:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: `Failed to fetch or parse feed: ${errorMessage}` }, { status: 500 })
  }
}
