import OpenAI from "openai";
import fs from "fs";

// Validate API key exists
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY environment variable is not set");
  const fallbackContent = "AI review could not be completed: OpenAI API key is missing. Please configure the OPENAI_API_KEY secret in GitHub repository settings.";
  fs.writeFileSync("hiring-tests/ai_review.md", fallbackContent);
  process.exit(0);
}

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
  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4", // Changed from gpt-4 to more accessible model
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
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.message);

    // Provide specific error messages based on error type
    let fallbackContent = "AI review could not be completed due to an error. Please review the code manually.";

    if (error.code === 'invalid_api_key') {
      fallbackContent = "AI review failed: Invalid OpenAI API key. Please check that the OPENAI_API_KEY secret is correctly configured.";
    } else if (error.code === 'insufficient_quota') {
      fallbackContent = "AI review failed: OpenAI API quota exceeded. Please check your OpenAI account billing.";
    } else if (error.code === 'model_not_found') {
      fallbackContent = "AI review failed: The requested model is not available. Please check your OpenAI account permissions.";
    } else if (error.status === 401) {
      fallbackContent = "AI review failed: Authentication error with OpenAI API. Please verify the API key is valid.";
    }

    fs.writeFileSync("hiring-tests/ai_review.md", fallbackContent);
    throw error; // Re-throw to see the full error in logs
  }
};

run().catch((e) => {
  console.error("❌ Failed AI review:", e);
  // Ensure fallback file exists even if error handling above fails
  if (!fs.existsSync("hiring-tests/ai_review.md")) {
    const fallbackContent = "AI review could not be completed due to an unexpected error. Please review the code manually.";
    fs.writeFileSync("hiring-tests/ai_review.md", fallbackContent);
  }
  process.exit(0); // Non bloccare il workflow
});
