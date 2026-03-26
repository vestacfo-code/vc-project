/**
 * Preprocesses content to convert various LaTeX math notations to 
 * the $...$ and $$...$$ format that remark-math/KaTeX expects.
 * Also escapes currency $ signs to prevent them from being interpreted as math.
 */
export function preprocessMath(content: string): string {
  if (!content) return content;
  
  let result = content;
  
  // First, escape currency $ signs ($ followed by numbers like $29.07 or $1,000)
  // Replace them with a placeholder that won't be interpreted as math
  result = result.replace(/\$(\d[\d,]*\.?\d*)/g, '\\$$1');
  
  // Convert \[ ... \] to $$...$$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math.trim()}$$`);
  
  // Convert \( ... \) to $...$
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);
  
  // Convert [ \text{...} ... ] style (common AI output) to $$...$$
  // This matches [ followed by LaTeX commands and ending with ]
  result = result.replace(/\[\s*(\\(?:text|frac|sum|prod|int|sqrt|times|div|cdot|pm|mp|leq|geq|neq|approx|equiv|infty|partial|nabla|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|omega|Gamma|Delta|Theta|Lambda|Sigma|Omega)[^[\]]*)\s*\]/g, 
    (_, math) => `$$${math.trim()}$$`
  );
  
  // Handle standalone [ formula = result ] patterns
  result = result.replace(/\[\s*([^[\]]*(?:\\frac|\\text|\\sum|\\sqrt|=)[^[\]]*)\s*\]/g, 
    (match, math) => {
      // Only convert if it looks like math (contains LaTeX commands or equations)
      if (/\\(?:frac|text|sum|sqrt|times|div|cdot)|=/.test(math)) {
        return `$$${math.trim()}$$`;
      }
      return match;
    }
  );
  
  return result;
}
