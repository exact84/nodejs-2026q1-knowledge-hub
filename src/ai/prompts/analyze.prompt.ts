export function buildAnalyzePrompt(
  content: string,
  task: 'review' | 'bugs' | 'optimize' | 'explain',
): string {
  return `
Analyze the following article.

Task: ${task}

Return STRICT JSON in this format:
{
  "analysis": "string",
  "suggestions": ["string"],
  "severity": "info" | "warning" | "error"
}

Article:
${content}
  `.trim();
}
