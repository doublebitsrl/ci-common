import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const codePath = "hiring-tests/src/tracker.js";
const snippet = fs.existsSync(codePath)
  ? fs.readFileSync(codePath, "utf8").slice(0, 2000)
  : "// no code found";

const systemPrompt =
  "You are an expert code reviewer focusing on readability, performance and requirements compliance.";
const userPrompt = `Please review this JavaScript code snippet:\n\`\`\`js\n${snippet}\n\`\`\``;

const run = async () => {
  const chat = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0.2,
    max_tokens: 150,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const output = chat.choices[0]?.message?.content ?? "No response from OpenAI.";
  console.log("📝 OpenAI output (truncated):");
  console.log(output.slice(0, 500));
  fs.writeFileSync("hiring-tests/ai_review.md", output);
};

run().catch((e) => {
  console.error("❌ Failed AI review:", e);
  // Create a fallback ai_review.md file to prevent ENOENT errors
  const fallbackContent = "AI review could not be completed due to an error. Please review the code manually.";
  fs.writeFileSync("hiring-tests/ai_review.md", fallbackContent);
  process.exit(0); // Non bloccare il workflow
});
