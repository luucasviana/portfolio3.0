"use client";

/**
 * Inline script that runs during HTML parsing (server render) but is inert on the
 * client (type="text/plain"), which avoids React's "script tag while rendering" warning.
 * Pattern from the Next.js guide "Preventing flash before hydration".
 */
export function InlineScript({ id, html }: { id: string; html: string }) {
  return (
    <script
      id={id}
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
