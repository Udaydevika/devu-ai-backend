import axios from "axios";

export async function getLiveNews(query) {
 
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        query
      )}&apiKey=${process.env.NEWS_API_KEY}`
    );

    const articles = res.data?.articles?.slice(0,5) || [];

    return articles
      .map((a, i) => `📰 ${i + 1}. ${a.title}`)
      .join("\n\n");
  } catch (err) {
    console.error("❌ News error:", err.message);
    return "⚠️ Failed to fetch news";
  }
}