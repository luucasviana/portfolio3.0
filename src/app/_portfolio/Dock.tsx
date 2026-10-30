"use client";

import type { NavHandler, SocialLink } from "./types";
import { useReducedMotion } from "./useReducedMotion";

const NAV_ITEMS = [
  { id: "home", icon: "fa-solid fa-house", label: "Início", cmd: "cd ~" },
  { id: "sobre", icon: "fa-solid fa-user", label: "Sobre", cmd: "cd sobre" },
  { id: "habilidades", icon: "fa-solid fa-code", label: "Habilidades", cmd: "cd skills" },
  { id: "projetos", icon: "fa-solid fa-briefcase", label: "Projetos", cmd: "cd projetos" },
  { id: "contatos", icon: "fa-solid fa-envelope", label: "Contato", cmd: "cd contato" },
];

interface DockProps {
  github?: SocialLink;
  onNavigate: NavHandler;
}

/** Left navigation dock (bottom bar on phones) with the reduce-motion toggle. */
export function Dock({ github, onNavigate }: DockProps) {
  const { reduced, toggle } = useReducedMotion();

  return (
    <aside className="t-dock">
      <a href="#home" onClick={(e) => onNavigate(e, "home")} className="t-dock__logo" aria-label="Início">
        LV<span className="t-blink">_</span>
      </a>

      <nav className="t-dock__nav" aria-label="Seções">
        {NAV_ITEMS.map((item, index) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => onNavigate(e, item.id)}
            className={index === 0 ? "nav-item t-dock__item active" : "nav-item t-dock__item"}
            data-section={item.id}
            aria-label={item.label}
          >
            <i className={item.icon} aria-hidden="true"></i>
            <span className="t-dock__tip">{item.cmd}</span>
          </a>
        ))}
      </nav>

      <div className="t-dock__footer">
        <button
          type="button"
          className="t-dock__motion"
          onClick={toggle}
          aria-pressed={reduced}
          aria-label="Reduzir animações"
          title={reduced ? "Animações reduzidas" : "Reduzir animações"}
        >
          <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
        </button>
        {github && (
          <a href={github.url} target="_blank" rel="noopener noreferrer" className="t-dock__social" aria-label="GitHub">
            <i className="fa-brands fa-github" aria-hidden="true"></i>
          </a>
        )}
      </div>
    </aside>
  );
}
