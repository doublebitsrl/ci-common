import OpenAI from "openai";
import fs from "fs";

// Validate API key exists
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY environment variable is not set");
  const fallbackReview = {
    overall_score: 5,
    code_quality: { score: 5, comments: "Unable to analyze due to missing API key" },
    best_practices: { score: 5, comments: "Unable to analyze due to missing API key" },
    performance: { score: 5, comments: "Unable to analyze due to missing API key" },
    maintainability: { score: 5, comments: "Unable to analyze due to missing API key" },
    strengths: ["Code submitted for review"],
    improvements: ["Manual review required due to AI analysis failure"],
    recommendation: "REVIEW"
  };
  fs.writeFileSync("hiring-tests/ai_review.json", JSON.stringify(fallbackReview, null, 2));
  process.exit(0);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const codePath = "hiring-tests/src/tracker.js";
const codeContent = fs.existsSync(codePath)
  ? fs.readFileSync(codePath, "utf8")
  : "// no code found";

const prompt = `
Please review this JavaScript code and provide a structured analysis in JSON format with the following structure:

{
  "overall_score": number (1-10),
  "code_quality": {
    "score": number (1-10),
    "comments": "string"
  },
  "best_practices": {
    "score": number (1-10),
    "comments": "string"
  },
  "performance": {
    "score": number (1-10),
    "comments": "string"
  },
  "maintainability": {
    "score": number (1-10),
    "comments": "string"
  },
  "strengths": ["array of strings"],
  "improvements": ["array of strings"],
  "recommendation": "PASS|REVIEW|FAIL"
}

Code to review:
\`\`\`javascript
${codeContent}
\`\`\`
`;

const run = async () => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a senior software engineer reviewing code for a hiring process. Provide detailed, constructive feedback in the exact JSON format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const aiReview = JSON.parse(response.choices[0].message.content);

    // Save the structured review as JSON
    fs.writeFileSync('hiring-tests/ai_review.json', JSON.stringify(aiReview, null, 2));

    console.log('AI review completed successfully');
    console.log(`Overall score: ${aiReview.overall_score}/10`);
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.message);

    // Provide fallback review in case of error
    const fallbackReview = {
      overall_score: 5,
      code_quality: { score: 5, comments: "Unable to analyze due to API error" },
      best_practices: { score: 5, comments: "Unable to analyze due to API error" },
      performance: { score: 5, comments: "Unable to analyze due to API error" },
      maintainability: { score: 5, comments: "Unable to analyze due to API error" },
      strengths: ["Code submitted for review"],
      improvements: ["Manual review required due to AI analysis failure"],
      recommendation: "REVIEW"
    };

    if (error.code === 'invalid_api_key') {
      fallbackReview.code_quality.comments = "Invalid OpenAI API key";
    } else if (error.code === 'insufficient_quota') {
      fallbackReview.code_quality.comments = "OpenAI API quota exceeded";
    } else if (error.code === 'model_not_found') {
      fallbackReview.code_quality.comments = "Requested model not available";
    } else if (error.status === 401) {
      fallbackReview.code_quality.comments = "Authentication error with OpenAI API";
    }

    fs.writeFileSync('hiring-tests/ai_review.json', JSON.stringify(fallbackReview, null, 2));
    throw error;
  }
};

run().catch((e) => {
  console.error("❌ Failed AI review:", e);
  // Ensure fallback file exists even if error handling above fails
  if (!fs.existsSync("hiring-tests/ai_review.json")) {
    const fallbackReview = {
      overall_score: 5,
      code_quality: { score: 5, comments: "Unexpected error during analysis" },
      best_practices: { score: 5, comments: "Unexpected error during analysis" },
      performance: { score: 5, comments: "Unexpected error during analysis" },
      maintainability: { score: 5, comments: "Unexpected error during analysis" },
      strengths: ["Code submitted for review"],
      improvements: ["Manual review required due to unexpected error"],
      recommendation: "REVIEW"
    };
    fs.writeFileSync("hiring-tests/ai_review.json", JSON.stringify(fallbackReview, null, 2));
  }
  process.exit(0);
});
