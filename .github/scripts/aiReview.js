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

const systemPrompt = `You are a senior software engineer reviewing code for a hiring process.

EVALUATION CRITERIA:
- Code Quality (1-10): Readability, structure, naming conventions, comments
- Best Practices (1-10): Error handling, security, proper patterns, standards compliance
- Performance (1-10): Efficiency, optimization, resource usage
- Maintainability (1-10): Modularity, testability, extensibility, documentation

SCORING GUIDELINES:
- 0: Functionality not implemented or not found
- 1-3: Poor/Unacceptable
- 4-6: Below Average/Needs Improvement
- 7-8: Good/Acceptable
- 9-10: Excellent/Outstanding

Be consistent in your scoring. Focus on objective technical criteria rather than subjective preferences.`

const prompt = `
Please review the following code and provide a structured JSON assessment using the available tool:

Code to review:
\`\`\`
${codeContent}
\`\`\`
`;

const run = async () => {
  try {
    const response = await openai.chat.completions.create({
        model: "gpt-4o", // oppure "gpt-4-1106-preview"
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "code_review_assessment",
              description: "Structured evaluation of a candidate's code submission.",
              parameters: {
                type: "object",
                properties: {
                  overall_score: {
                    type: "number",
                    description: "Overall score between 1 and 10",
                    minimum: 1,
                    maximum: 10
                  },
                  code_quality: {
                    type: "object",
                    description: "Assessment of code quality",
                    properties: {
                      score: {
                        type: "number",
                        description: "Score for code quality (1-10)",
                        minimum: 1,
                        maximum: 10
                      },
                      comments: {
                        type: "string",
                        description: "Comments about the code quality"
                      }
                    },
                    required: ["score", "comments"],
                    additionalProperties: false
                  },
                  best_practices: {
                    type: "object",
                    description: "Assessment of adherence to best practices",
                    properties: {
                      score: {
                        type: "number",
                        description: "Score for best practices (1-10)",
                        minimum: 1,
                        maximum: 10
                      },
                      comments: {
                        type: "string",
                        description: "Comments about best practices"
                      }
                    },
                    required: ["score", "comments"],
                    additionalProperties: false
                  },
                  performance: {
                    type: "object",
                    description: "Assessment of code performance",
                    properties: {
                      score: {
                        type: "number",
                        description: "Score for performance (1-10)",
                        minimum: 1,
                        maximum: 10
                      },
                      comments: {
                        type: "string",
                        description: "Comments about performance"
                      }
                    },
                    required: ["score", "comments"],
                    additionalProperties: false
                  },
                  maintainability: {
                    type: "object",
                    description: "Assessment of code maintainability",
                    properties: {
                      score: {
                        type: "number",
                        description: "Score for maintainability (1-10)",
                        minimum: 1,
                        maximum: 10
                      },
                      comments: {
                        type: "string",
                        description: "Comments about maintainability"
                      }
                    },
                    required: ["score", "comments"],
                    additionalProperties: false
                  },
                  strengths: {
                    type: "array",
                    description: "List of strengths identified in the code",
                    items: {
                      type: "string",
                      description: "A particular strength"
                    }
                  },
                  improvements: {
                    type: "array",
                    description: "Areas for improvement",
                    items: {
                      type: "string",
                      description: "A suggested improvement"
                    }
                  },
                  recommendation: {
                    type: "string",
                    description: "Final recommendation for the code review",
                    enum: ["PASS", "REVIEW", "FAIL"]
                  }
                },
                required: [
                  "overall_score",
                  "code_quality",
                  "best_practices",
                  "performance",
                  "maintainability",
                  "strengths",
                  "improvements",
                  "recommendation"
                ],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "code_review_assessment"
          }
        },
        response_format: { type: "json_object" },
        temperature: 0
      });

    const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "code_review_assessment") {
      throw new Error("Tool call response is missing or malformed");
    }

    const aiReview = JSON.parse(toolCall.function.arguments);

    // Save the structured review as JSON
    fs.writeFileSync('hiring-tests/ai_review.json', JSON.stringify(aiReview, null, 2));

    console.log('AI review completed successfully');
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
