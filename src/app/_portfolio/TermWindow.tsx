import type { CSSProperties, ReactNode } from "react";

interface TermWindowProps {
  path: string;
  accent?: string;
  className?: string;
  children: ReactNode;
}

/** Terminal "window" card: thin title bar with traffic dots and a ~/path. */
export function TermWindow({ path, accent, className, children }: TermWindowProps) {
  return (
    <article
      className={className ? `t-win ${className}` : "t-win"}
      style={{ "--win-accent": accent ?? "var(--t-phosphor)" } as CSSProperties}
    >
      <header className="t-win__bar">
        <span className="t-win__dots" aria-hidden="true">
          ●●●
        </span>
        <span className="t-win__path">{path}</span>
      </header>
      <div className="t-win__body">{children}</div>
    </article>
  );
}
