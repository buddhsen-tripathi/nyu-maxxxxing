"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ text }: { text: string }) {
  return (
    <div className="text-sm leading-relaxed [&>*+*]:mt-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="ml-4 list-disc space-y-1 marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-4 list-decimal space-y-1 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-secondary-foreground">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md bg-secondary p-3 font-mono text-xs text-secondary-foreground">
              {children}
            </pre>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-semibold text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-foreground">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
