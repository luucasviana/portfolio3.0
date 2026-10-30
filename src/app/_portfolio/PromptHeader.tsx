import type { CSSProperties } from "react";

interface TypedProps {
  text: string;
  className?: string;
  /** Render the blinking block cursor after the text (default true). */
  cursor?: boolean;
}

/** Monospace text that "types" itself in when its section gets .in-view (CSS-only). */
export function Typed({ text, className, cursor = true }: TypedProps) {
  return (
    <>
      <span className={className ? `t-typed ${className}` : "t-typed"} style={{ "--n": text.length } as CSSProperties}>
        {text}
      </span>
      {cursor && (
        <span className="t-cursor" aria-hidden="true">
          ▍
        </span>
      )}
    </>
  );
}

interface PromptHeaderProps {
  command: string;
  title: string;
}

/** User shown in every terminal prompt (`@luucasviana:~$`). */
export const PROMPT_USER = "@luucasviana";

/** Section header: `@luucasviana:~$ <command>` prompt line above the human title. */
export function PromptHeader({ command, title }: PromptHeaderProps) {
  return (
    <div className="t-head">
      <p className="t-prompt">
        <span className="t-prompt__user">{PROMPT_USER}</span>:<span className="t-prompt__path">~</span>${" "}
        <Typed text={command} />
      </p>
      <h2 className="t-head__title">{title}</h2>
    </div>
  );
}
