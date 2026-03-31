import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://www.heise.de/security/rss/news-atom.xml", {
      next: { revalidate: 1800 }, // Cache 30 min
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Feed nicht erreichbar" }, { status: 502 });
    }

    const xml = await res.text();

    // Simple XML parsing for Atom feed
    const entries: Array<{
      title: string;
      link: string;
      summary: string;
      published: string;
      image: string | null;
    }> = [];

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null && entries.length < 8) {
      const entry = match[1];

      const title = extractCDATA(entry, "title") || extractTag(entry, "title");
      const link = extractAttr(entry, "link", "href");
      const summary = extractCDATA(entry, "summary") || extractTag(entry, "summary");
      const published = extractTag(entry, "published") || extractTag(entry, "updated");

      // Extract image from content
      const imgMatch = entry.match(/src="([^"]+)"/);
      const image = imgMatch ? imgMatch[1] : null;

      if (title && link) {
        entries.push({
          title: cleanHTML(title),
          link,
          summary: cleanHTML(summary || ""),
          published: published || "",
          image,
        });
      }
    }

    return NextResponse.json({ articles: entries, source: "heise security" });
  } catch (err) {
    console.error("Security news fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return match ? match[1].trim() : "";
}

function extractCDATA(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  return match ? match[1].trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*/?>`, "i"));
  return match ? match[1] : "";
}

function cleanHTML(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}
