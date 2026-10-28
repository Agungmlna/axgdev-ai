require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
const SYSTEM_PROMPT =
  "Kamu adalah asisten AI dari AXGDEV23, sebuah layanan pembuatan website dan aplikasi web/mobile untuk UMKM dan SME. " +
  "Jawab dengan ramah, singkat, dan dalam bahasa yang sama dengan pengguna.";

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
  const clean = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20);

  if (clean.length === 0 || clean[clean.length - 1].role !== "user") {
    return res.status(400).json({ error: "Pesan tidak valid." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: clean,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic error:", data);
      return res.status(502).json({ error: "Gagal menghubungi AI." });
    }

    const reply = data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.listen(PORT, () => console.log(`axgdev-ai berjalan di http://localhost:${PORT}`));
