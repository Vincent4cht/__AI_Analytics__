import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];

  let keyCounter = 0;
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeSnippet = "";
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  const parseInlineStyles = (text: string) => {
    // Regex split but standard parts for bold (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-slate-900 border-b border-indigo-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const flushList = () => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`ul-${keyCounter++}`} className="list-disc pl-6 my-3 space-y-1 text-slate-700">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      renderedElements.push(
        <blockquote key={`quote-${keyCounter++}`} className="border-l-4 border-indigo-500 pl-4 py-1.5 my-3 bg-slate-50 italic text-slate-600 rounded-r">
          {blockquoteLines.map((line, i) => (
            <p key={i}>{parseInlineStyles(line)}</p>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const origLine = lines[i];
    const line = origLine.trim();

    // Code Block Handling
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        renderedElements.push(
          <pre key={`code-${keyCounter++}`} className="bg-slate-900 text-slate-100 rounded-lg p-3.5 font-mono text-xs overflow-x-auto my-3 shadow-inner">
            <code>{codeSnippet}</code>
          </pre>
        );
        codeSnippet = "";
        inCodeBlock = false;
      } else {
        flushList();
        flushBlockquote();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeSnippet += origLine + "\n";
      continue;
    }

    // Header 1 (# Title)
    if (line.startsWith("# ")) {
      flushList();
      flushBlockquote();
      renderedElements.push(
        <h1 key={keyCounter++} className="text-2xl font-black text-slate-800 mt-6 mb-3 tracking-tight">
          {parseInlineStyles(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Header 2 (## Title)
    if (line.startsWith("## ")) {
      flushList();
      flushBlockquote();
      renderedElements.push(
        <h2 key={keyCounter++} className="text-lg font-bold text-slate-800 mt-5 mb-2.5 border-b border-slate-150 pb-1 flex items-center gap-1.5">
          {parseInlineStyles(line.slice(3))}
        </h2>
      );
      continue;
    }

    // Header 3 (### Title)
    if (line.startsWith("### ")) {
      flushList();
      flushBlockquote();
      renderedElements.push(
        <h3 key={keyCounter++} className="text-md font-semibold text-slate-800 mt-4 mb-2">
          {parseInlineStyles(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Blockquote (>)
    if (line.startsWith(">")) {
      flushList();
      inBlockquote = true;
      const content = line.slice(1).trim();
      blockquoteLines.push(content);
      continue;
    }

    // Bullet List Item (- or * or numbered lists)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushBlockquote();
      inList = true;
      const text = line.slice(2);
      listItems.push(
        <li key={`li-${listItems.length}-${keyCounter++}`} className="marker:text-indigo-500 leading-relaxed">
          {parseInlineStyles(text)}
        </li>
      );
      continue;
    }

    // Paragraph or Empty Line
    if (line === "") {
      flushList();
      flushBlockquote();
      renderedElements.push(<div key={keyCounter++} className="h-1"></div>);
    } else {
      if (inList) {
        flushList();
      }
      if (inBlockquote) {
        flushBlockquote();
      }
      renderedElements.push(
        <p key={keyCounter++} className="text-slate-600 leading-relaxed my-2">
          {parseInlineStyles(line)}
        </p>
      );
    }
  }

  // Final flush
  flushList();
  flushBlockquote();

  return <div className="space-y-1">{renderedElements}</div>;
}
