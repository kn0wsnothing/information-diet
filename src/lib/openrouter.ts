/**
 * OpenRouter API client for AI completions
 * Uses OpenAI-compatible endpoint for flexible model selection
 */

interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface CompletionResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}

export async function generateCompletion(
  prompt: string,
  options: CompletionOptions = {},
): Promise<CompletionResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "google/gemini-flash-1.5";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable not set");
  }

  const requestBody = {
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 200,
    top_p: options.topP ?? 1,
  };

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "information-diet",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", response.status, errorData);
      throw new Error(
        `OpenRouter API error: ${response.status} ${JSON.stringify(errorData)}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    return {
      content,
      tokensUsed: {
        input: usage.prompt_tokens,
        output: usage.completion_tokens,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("OpenRouter")) {
      throw error;
    }
    console.error("OpenRouter request failed:", error);
    throw new Error(
      `Failed to generate completion: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
