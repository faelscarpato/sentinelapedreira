import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Components } from "react-markdown";
import type { ExtraProps } from "react-markdown";
import type { AnchorHTMLAttributes } from "react";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      "href",
      "title",
      "rel",
      "target",
    ],
  },
};

function sanitizeHref(href?: string) {
  if (!href) return null;

  if (href.startsWith("/") || href.startsWith("#")) {
    return href;
  }

  if (/^mailto:/i.test(href) || /^tel:/i.test(href)) {
    return href;
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  return null;
}

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps;

const components: Components = {
  a: ({ href, children, ...props }: AnchorProps) => {
    const safeHref = sanitizeHref(href);

    if (!safeHref) {
      return <span>{children}</span>;
    }

    const isExternal = /^https?:\/\//i.test(safeHref);

    return (
      <a
        {...props}
        href={safeHref}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer nofollow" : undefined}
      >
        {children}
      </a>
    );
  },
};

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

export function SafeMarkdown({ content, className }: SafeMarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer", "nofollow"] }],
        ]}
        skipHtml
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
