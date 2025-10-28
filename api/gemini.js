// api/gemini.js
// Vercel 서버리스 함수 (웹에서만 배포 가능)
// POST { "input": "프롬프트" } -> Gemini로 중계

const ALLOWED_ORIGIN = "*"; // 나중에 본인 도메인으로 바꾸면 보안↑

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { input } = req.body || {};
    if (!input || typeof input !== "string") {
      return res.status(400).json({ error: "Body must include 'input' string." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY missing" });

    
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;


    const body = { contents: [{ role: "user", parts: [{ text: input }] }] };

    const gRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!gRes.ok) {
      const err = await gRes.text().catch(() => "");
      return res.status(gRes.status).json({ error: "Gemini API error", details: err });
    }

    const data = await gRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") ?? null;

    return res.status(200).json({ ok: true, text, raw: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
