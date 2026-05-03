export const buildSummarizePrompt = (
  content: string,
  maxLength: 'short' | 'medium' | 'detailed',
): string => {
  return `
You are a technical content summarizer.

Summarize the following article.

Length: ${maxLength}

Rules:
- Keep key ideas
- No hallucinations
- Output plain text only

Article:
${content}
`;
};
