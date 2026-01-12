import type { TransformerRule, AskUserQuestion } from "../types.js";

function formatQuestions(questions: AskUserQuestion[]): string {
  return questions
    .map((q) => {
      const optionsText = q.options
        .map((opt) => `- ${opt.label}: ${opt.description}`)
        .join("\n");
      return `**Question: ${q.header}**\n${q.question}\n${optionsText}`;
    })
    .join("\n\n");
}

function extractAnswers(content: string): string | null {
  const match = content.match(
    /User has answered your questions:(.+?)(?:\. You can now continue|$)/
  );
  if (!match) {
    return null;
  }

  const rawAnswers = match[1].trim();
  const answerMatches = rawAnswers.matchAll(/"[^"]*"="([^"]*)"/g);
  const answers = Array.from(answerMatches, (m) => m[1]);

  if (answers.length === 0) {
    return null;
  }

  return `**Answer:** ${answers.join(", ")}`;
}

export const askUserQuestionTransformer: TransformerRule = {
  name: "ask-user-question",
  description: "Extract AskUserQuestion tool_use and tool_result content",
  transform: (item) => {
    // Handle tool_use (question)
    if (
      item.type === "tool_use" &&
      item.name === "AskUserQuestion" &&
      item.input?.questions
    ) {
      return formatQuestions(item.input.questions);
    }

    // Handle tool_result (answer)
    if (item.type === "tool_result" && typeof item.content === "string") {
      return extractAnswers(item.content);
    }

    return null;
  },
};
