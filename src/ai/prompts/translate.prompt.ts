export function buildTranslatePrompt(
  content: string,
  targetLanguage: string,
  sourceLanguage?: string,
): string {
  return `
Translate the following text.

${sourceLanguage ? `Source language: ${sourceLanguage}` : ''}

Target language: ${targetLanguage}

Text:
${content}

Return only translated text.
  `.trim();
}
