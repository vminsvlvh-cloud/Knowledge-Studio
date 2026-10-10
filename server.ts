import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize GoogleGenAI client lazily or safely with User-Agent
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API: Ask Vault / Synthesize across notes
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { question, notesContext, language = "en" } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    const isArabic = language === "ar";
    const ai = getGenAI();
    if (!ai) {
      return res.json({
        answer: isArabic
          ? `أعمل حالياً في الوضع المحلي لعدم توفر مفتاح Gemini API. تم تحليل سؤالك: "${question}". لتفعيل الذكاء الاصطناعي التوليدي عبر خزانة ملاحظاتك، يرجى ضبط GEMINI_API_KEY.`
          : `I am currently operating in offline mode because no Gemini API key was detected in the environment. Here is a simulated response based on your question "${question}". To enable live generative intelligence across your notes, ensure GEMINI_API_KEY is configured in your project secrets.`,
        citedNotes: [],
        suggestedQuestions: isArabic
          ? [
              "كيف ترتبط هذه المفاهيم ببعضها البعض؟",
              "ما هي النماذج الذهنية المستخلصة هنا؟",
              "هل يمكنك تقديم ملخص بأهم الأفكار؟",
            ]
          : [
              "How do these concepts link together?",
              "What are the key mental models here?",
              "Can you generate a summary checklist?",
            ],
      });
    }

    const langInstruction = isArabic
      ? "Respond entirely in fluent, professional, modern standard Arabic (اللغة العربية الفصحى). When citing concepts from the notes, use exact bidirectional wiki-links like [[عنوان الملاحظة]]."
      : "Respond in clear English. When citing concepts from the notes, use exact bidirectional wiki-links like [[Note Title]].";

    const systemPrompt = `You are Synapse, an intelligent Knowledge Assistant operating directly over a user's Personal Knowledge Vault.
The user's notes are provided below in the context.
${langInstruction}
Your duties:
1. Answer the question accurately and thoughtfully based on the provided notes whenever possible.
2. Whenever you mention or draw insights from a specific note, format its title as a bidirectional wiki-link like [[Note Title]].
3. If the answer spans multiple notes, synthesize connections and highlight emergent insights between them.
4. If the notes do not contain enough info, synthesize what is available, clearly state what was found in the vault, and provide relevant foundational knowledge.
5. End with 2-3 short, relevant follow-up questions the user might want to explore.

Context Notes from Vault:
${notesContext || "No notes provided."}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: question,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const text = response.text || "";

    // Extract cited notes format [[...]]
    const citedMatches = text.match(/\[\[(.*?)\]\]/g) || [];
    const citedNotes = Array.from(
      new Set(citedMatches.map((m) => m.replace(/\[\[|\]\]/g, "").trim()))
    );

    res.json({
      answer: text,
      citedNotes,
    });
  } catch (error: any) {
    console.error("AI Ask error:", error);
    res.status(500).json({
      error: error.message || "Failed to process question with AI",
    });
  }
});

// API: Auto-summarize & Extract Insights for a Note
app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { title, content, language = "en" } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required." });
    }

    const isArabic = language === "ar";
    const ai = getGenAI();
    if (!ai) {
      // Local fallback summary
      const lines = content.split("\n").filter((l: string) => l.trim().length > 0);
      const preview = lines.slice(0, 3).join(" ").substring(0, 240);
      return res.json({
        summary: preview + "...",
        keyTakeaways: isArabic
          ? [
              "المفهوم الجوهري موضح في متن الملاحظة الأساسية.",
              "يرتبط المفهوم بشبكة تصنيفات المعرفة الحالية.",
              "يوصى بالتوسع لإضفاء طابع الديمومة (Evergreen).",
            ]
          : [
              "Core concept outlined in the main note body.",
              "Related to existing knowledge taxonomy.",
              "Further elaboration recommended for evergreen status.",
            ],
        tags: isArabic ? ["معرفة", "ملاحظات"] : ["knowledge", "notes"],
      });
    }

    const langInstruction = isArabic
      ? "Write the executive summary, key takeaways, and tags entirely in fluent modern standard Arabic."
      : "Write in clear English.";

    const prompt = `Analyze this note titled "${title}":
${content}

${langInstruction}

Provide:
1. An executive summary (max 2 sentences).
2. Exactly 3 key takeaways / mental insights.
3. 3-5 recommended tags (lowercase, single words or hyphenated).

Return in this JSON structure:
{
  "summary": "...",
  "keyTakeaways": ["...", "...", "..."],
  "tags": ["tag1", "tag2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("AI Summarize error:", error);
    res.status(500).json({ error: error.message || "Failed to summarize note" });
  }
});

// API: Suggest Connections and Wiki-Links to other vault notes
app.post("/api/ai/suggest-links", async (req, res) => {
  try {
    const { currentTitle, currentContent, vaultTitles, language = "en" } = req.body;
    const isArabic = language === "ar";
    const ai = getGenAI();

    if (!ai) {
      // Fallback simple link suggester based on title substring matching
      const suggestions: any[] = [];
      for (const t of vaultTitles || []) {
        if (
          t.toLowerCase() !== currentTitle?.toLowerCase() &&
          currentContent?.toLowerCase().includes(t.toLowerCase())
        ) {
          suggestions.push({
            noteTitle: t,
            reason: isArabic ? `تم ذكر هذا المصطلح مباشرة في المحتوى.` : `Direct term mentioned in your content.`,
            confidence: "high",
          });
        }
      }
      return res.json({
        suggestedLinks: suggestions.slice(0, 4),
        suggestedNewConcepts: isArabic
          ? [{ title: "التعقيد الناشئ", description: "جسر مفاهيمي لربط النظم الديناميكية" }]
          : [{ title: "Emergent Complexity", description: "Conceptual bridge for dynamic systems" }],
      });
    }

    const langInstruction = isArabic
      ? "Provide connection reasons and concept descriptions in fluent Arabic. Keep 'noteTitle' identical to existing vault titles."
      : "Provide reasons and descriptions in English.";

    const prompt = `You are a knowledge graph architect.
Current Note Title: "${currentTitle}"
Current Note Content:
"""${currentContent}"""

Existing Note Titles in Vault:
${JSON.stringify(vaultTitles || [])}

${langInstruction}

Tasks:
1. Identify existing notes from the vault list that are conceptually or directly related to this note. Explain why they should be connected via [[wiki-links]].
2. Suggest 2-3 new concept notes the user could create to deepen their knowledge graph.

Format JSON:
{
  "suggestedLinks": [
    { "noteTitle": "Existing Note Title", "reason": "Short reason for cross-linking", "confidence": "high|medium" }
  ],
  "suggestedNewConcepts": [
    { "title": "New Concept Title", "description": "Why this would bridge ideas" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("AI Suggest Links error:", error);
    res.status(500).json({ error: error.message || "Failed to suggest links" });
  }
});

// API: Find Unlinked References (existing concepts mentioned in note text but not yet [[linked]])
app.post("/api/ai/find-unlinked-references", async (req, res) => {
  try {
    const { currentTitle, currentContent, vaultConcepts, language = "en" } = req.body;
    if (!currentContent) {
      return res.json({ unlinkedReferences: [] });
    }

    const isArabic = language === "ar";

    // 1. Deterministic baseline: extract already linked titles
    const linkedMatches = currentContent.match(/\[\[(.*?)\]\]/g) || [];
    const alreadyLinked = new Set(
      linkedMatches.map((m: string) => m.slice(2, -2).trim().toLowerCase())
    );

    // Filter concepts that are:
    // a. Not the current note itself
    // b. Not already explicitly linked with [[...]]
    const candidateConcepts: { id?: string; title: string; folder?: string }[] = (vaultConcepts || []).filter(
      (c: any) =>
        c.title.toLowerCase() !== currentTitle?.toLowerCase() &&
        !alreadyLinked.has(c.title.toLowerCase())
    );

    // Fast local scanner to find exact or case-insensitive mentions outside of existing brackets
    const localFound: any[] = [];
    for (const concept of candidateConcepts) {
      const escaped = concept.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Look for Unicode-aware word boundary match that is NOT preceded by [[ and NOT followed by ]]
      const regex = new RegExp(`(?<!\\[\\[)(?<![\\p{L}\\p{N}])(${escaped})(?![\\p{L}\\p{N}])(?!\\]\\])`, "giu");
      const matches = Array.from(currentContent.matchAll(regex));

      if (matches.length > 0) {
        // Extract context snippet around first match
        const firstMatch = matches[0] as RegExpExecArray;
        const matchIndex = firstMatch.index ?? 0;
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(currentContent.length, matchIndex + concept.title.length + 50);
        let snippet = currentContent.slice(start, end).replace(/\n+/g, " ").trim();
        if (start > 0) snippet = "..." + snippet;
        if (end < currentContent.length) snippet = snippet + "...";

        localFound.push({
          conceptId: concept.id,
          conceptTitle: concept.title,
          folder: concept.folder,
          matchedText: firstMatch[0],
          snippet,
          occurrencesCount: matches.length,
          reason: isArabic
            ? `ذُكر هذا المفهوم ${matches.length} مرة كنص عادي في الملاحظة.`
            : `Mentioned ${matches.length} time${matches.length > 1 ? "s" : ""} in note text as plain text.`,
        });
      }
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({ unlinkedReferences: localFound });
    }

    const langInstruction = isArabic
      ? "Provide the 'reason' field in fluent modern standard Arabic. Keep 'conceptTitle' exactly matching the existing vault concept title."
      : "Provide 'reason' in English.";

    // Enhance with Gemini for subtle/variant concept mentions
    const prompt = `You are a knowledge graph linker.
Active Note Title: "${currentTitle}"
Active Note Content:
"""${currentContent}"""

List of Existing Vault Concepts (titles):
${JSON.stringify(candidateConcepts.map((c) => c.title))}

${langInstruction}

Task:
Identify mentions of these vault concepts in the active note's text that are currently PLAIN TEXT and NOT enclosed in [[double brackets]].
Include exact title mentions as well as direct plurals or close variants (e.g., "feedback loops" for "Feedback Loops").

For each unlinked reference found:
1. "conceptTitle": Exact title of the existing vault concept.
2. "matchedText": The exact text fragment in the note that should be converted into [[conceptTitle]].
3. "snippet": Short excerpt (around 80 chars) of the surrounding sentence showing context.
4. "occurrencesCount": Estimated number of occurrences.
5. "reason": Why turning this mention into a bidirectional link strengthens the knowledge graph.

Return JSON in this format:
{
  "unlinkedReferences": [
    {
      "conceptTitle": "Existing Concept",
      "matchedText": "text as it appears",
      "snippet": "...surrounding sentence...",
      "occurrencesCount": 1,
      "reason": "..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const aiResults = parsed.unlinkedReferences || [];

    // Merge AI results with local deterministic results so nothing is missed
    const combinedMap = new Map<string, any>();
    for (const item of localFound) {
      combinedMap.set(item.conceptTitle.toLowerCase(), item);
    }
    for (const item of aiResults) {
      const key = item.conceptTitle?.toLowerCase();
      if (key) {
        if (combinedMap.has(key)) {
          // Enrich with AI reason
          const existing = combinedMap.get(key);
          existing.reason = item.reason || existing.reason;
        } else {
          combinedMap.set(key, item);
        }
      }
    }

    res.json({ unlinkedReferences: Array.from(combinedMap.values()) });
  } catch (error: any) {
    console.error("AI Find Unlinked References error:", error);
    res.status(500).json({ error: error.message || "Failed to find unlinked references" });
  }
});

// API: Generate Flashcards for Active Recall
app.post("/api/ai/generate-flashcards", async (req, res) => {
  try {
    const { title, content, language = "en" } = req.body;
    const isArabic = language === "ar";
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        flashcards: isArabic
          ? [
              {
                question: `ما هي الفكرة الجوهرية لمفهوم "${title}"؟`,
                answer: `استكشاف التعريف الأساسي والتطبيقات العملية الموضحة في ${title}.`,
              },
              {
                question: `كيف يرتبط "${title}" بباقي النماذج الذهنية في الخزانة؟`,
                answer: `يمثل حجر زاوية للتفكير المنظومي وتوليف المعرفة الإبداعي.`,
              },
            ]
          : [
              {
                question: `What is the core premise of ${title}?`,
                answer: `Examine the primary definition and applications outlined in ${title}.`,
              },
              {
                question: `How does ${title} connect to broader mental models?`,
                answer: `It serves as a foundational building block for system thinking and synthesis.`,
              },
            ],
      });
    }

    const langInstruction = isArabic
      ? "Write the flashcard questions and answers in fluent modern standard Arabic."
      : "Write in clear English.";

    const prompt = `Generate 3 to 5 high-quality active-recall flashcards from this note.
Title: "${title}"
Content:
"""${content}"""

${langInstruction}

Rules for good flashcards:
- Questions must test deep understanding, principles, contrasts, or mechanisms—not trivial trivia.
- Answers should be punchy, clear, and easy to grade yourself on.

Return JSON:
{
  "flashcards": [
    { "question": "...", "answer": "..." }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Flashcards error:", error);
    res.status(500).json({ error: error.message || "Failed to generate flashcards" });
  }
});

// API: Generate Mindmap / Outline
app.post("/api/ai/mindmap", async (req, res) => {
  try {
    const { title, content, language = "en" } = req.body;
    const isArabic = language === "ar";
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        root: {
          label: title,
          children: isArabic
            ? [
                { label: "المبادئ الأساسية", children: [{ label: "الأسس والمفاهيم" }, { label: "الخطوات الأولى" }] },
                { label: "التطبيقات العملية", children: [{ label: "سير العمل التطبيقي" }] },
              ]
            : [
                { label: "Core Principles", children: [{ label: "Foundations" }, { label: "First Steps" }] },
                { label: "Applications", children: [{ label: "Practical Workflow" }] },
              ],
        },
      });
    }

    const langInstruction = isArabic
      ? "Write the mindmap nodes and labels in fluent Arabic."
      : "Write in English.";

    const prompt = `Create a hierarchical mindmap structure for this note.
Title: "${title}"
Content:
"""${content}"""

${langInstruction}

Return JSON format:
{
  "root": {
    "label": "${title}",
    "children": [
      {
        "label": "Section / Major Idea",
        "children": [
          { "label": "Sub-concept" }
        ]
      }
    ]
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Mindmap error:", error);
    res.status(500).json({ error: error.message || "Failed to generate mindmap" });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Synapse Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
