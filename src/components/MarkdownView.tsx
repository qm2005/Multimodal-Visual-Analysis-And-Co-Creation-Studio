import React from "react";

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  if (!content) return null;

  // Split content by paragraphs/blocks
  const blocks = content.split(/\n\n+/);

  const renderText = (text: string) => {
    // Basic bold **text** replacement
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-slate-900 border-b border-indigo-200 bg-indigo-50/50 px-1 rounded mx-0.5">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 text-slate-700 leading-relaxed text-base tracking-normal text-justify">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Headers e.g., # or ##
        if (trimmed.startsWith("#")) {
          const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (match) {
            const level = match[1].length;
            const text = match[2];
            if (level === 1) {
              return (
                <h1 key={idx} className="text-2xl md:text-3xl font-display font-bold text-slate-900 border-b border-slate-100 pb-2 mt-6 mb-4">
                  {renderText(text)}
                </h1>
              );
            } else if (level === 2) {
              return (
                <h2 key={idx} className="text-xl md:text-2xl font-display font-semibold text-slate-800 mt-5 mb-3 flex items-center">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-sm mr-2 inline-block"></span>
                  {renderText(text)}
                </h2>
              );
            } else {
              return (
                <h3 key={idx} className="text-lg font-display font-medium text-slate-800 mt-4 mb-2">
                  {renderText(text)}
                </h3>
              );
            }
          }
        }

        // 2. Blockquotes e.g., >
        if (trimmed.startsWith(">")) {
          const quoteText = trimmed.replace(/^>\s*/gm, "");
          return (
            <blockquote key={idx} className="border-l-4 border-indigo-500 bg-indigo-50/20 px-4 py-3 my-4 rounded-r-lg font-serif italic text-slate-700">
              {quoteText.split("\n").map((line, lIdx) => (
                <p key={lIdx} className="mb-1">{renderText(line)}</p>
              ))}
            </blockquote>
          );
        }

        // 3. Bullet list points e.g., - or *
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n[-*]\s+/);
          return (
            <ul key={idx} className="list-disc pl-5 space-y-2 my-2">
              {items.map((item, iIdx) => {
                const cleanedItem = iIdx === 0 ? item.replace(/^[-*]\s+/, "") : item;
                return (
                  <li key={iIdx} className="text-slate-700">
                    {renderText(cleanedItem)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Default Paragraph
        return (
          <p key={idx} className="mb-3 text-slate-700 whitespace-pre-line leading-relaxed">
            {renderText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
