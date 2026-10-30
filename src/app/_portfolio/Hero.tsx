"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { recordClickAction } from "../admin/analytics";
import { PROMPT_USER, Typed } from "./PromptHeader";
import type { NavHandler, Profile } from "./types";

/** Lucas' cats, shown in the status bar: Mia (tuxedo) and Callie (tabby). */
export const CATS = { tux: "Mia", tabby: "Callie" };

/** VT323 1ch = 0.4em: at the 112px cap only ~14 chars fit the 640px column; longer names wrap untyped. */
const TYPED_NAME_MAX = 14;

const subscribeClock = (onChange: () => void) => {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
};
const getClock = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const getServerClock = () => "";

interface HeroProps {
  profile: Profile;
  onNavigate: NavHandler;
}

export function Hero({ profile, onNavigate }: HeroProps) {
  const clock = useSyncExternalStore(subscribeClock, getClock, getServerClock);
  const name = profile.name || "Lucas Viana";

  return (
    <div className="t-hero">
      <p className="t-prompt">
        <span className="t-prompt__user">{PROMPT_USER}</span>:<span className="t-prompt__path">~</span>${" "}
        <Typed text="./start.sh" />
      </p>
      <h1 className="t-hero__name" style={{ "--name-n": name.length } as CSSProperties}>
        {name.length <= TYPED_NAME_MAX ? <Typed text={name} cursor={false} /> : name}
      </h1>
      <h2 className="t-hero__subtitle">
        {profile.subtitle || "Desenvolvedor, IA & Designer UI"}
        <span>.</span>
      </h2>
      <p className="t-hero__desc">{profile.description}</p>

      <div className="t-hero__actions">
        {profile.cv_url && profile.cv_visible !== false && (
          <a
            href={`/api/download?url=${encodeURIComponent(profile.cv_url)}`}
            onClick={() => recordClickAction("cv")}
            className="t-btn t-btn--cta"
          >
            <i className="fa-solid fa-download" aria-hidden="true"></i> Download CV
          </a>
        )}
        <a href="#projetos" onClick={(e) => onNavigate(e, "projetos")} className="t-btn t-btn--ghost nav-trigger">
          Ver Projetos <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </a>
      </div>

      <div className="t-status" aria-label="Status">
        <span className="t-status__seg t-status__seg--host">{PROMPT_USER}</span>
        <span className="t-status__seg t-status__seg--host">
          <span className="t-status__dot" aria-hidden="true">●</span> online
        </span>
        <span className="t-status__seg">
          [{CATS.tux}] caçando bugs
        </span>
        <span className="t-status__seg">
          [{CATS.tabby}] dormindo
        </span>
        <span className="t-status__seg t-status__seg--host t-status__clock">{clock}</span>
      </div>
    </div>
  );
}
