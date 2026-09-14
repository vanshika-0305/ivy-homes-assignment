type ResponseLike = { status: (code: number) => ResponseLike; json: (value: unknown) => void };

export default async function handler(request: { method?: string; body?: { query?: string } }, response: ResponseLike) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const query = request.body?.query?.trim();
  if (!query) return response.status(400).json({ error: "query is required" });
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return response.status(503).json({ error: "Grok is not configured" });

  const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "grok-3-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Extract property-search intent only. Return JSON with optional bedroom number, locality lowercase, minPrice/maxPrice in INR, furnishing, propertyType, and priority as best_value, lowest_price, largest_area, premium, or balanced. Never recommend a property or invent missing values." },
        { role: "user", content: query },
      ],
    }),
  });
  if (!grokResponse.ok) return response.status(502).json({ error: "Grok request failed" });
  const payload = await grokResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
  try {
    return response.status(200).json(JSON.parse(payload.choices?.[0]?.message?.content ?? "{}"));
  } catch {
    return response.status(502).json({ error: "Grok returned invalid JSON" });
  }
}