"use client";

import type { CSSProperties } from "react";
import { recordClickAction } from "../../admin/analytics";
import { PromptHeader } from "../PromptHeader";
import type { SocialLink } from "../types";

interface ContactProps {
  socials: SocialLink[];
}

export function Contact({ socials }: ContactProps) {
  return (
    <>
      <PromptHeader command="./contato.sh" title="Contatos" />

      <p className="t-contact-intro">
        Se você tem um projeto em mente, precisa de um desenvolvedor dedicado para a sua equipe, ou quer apenas trocar uma ideia sobre desenvolvimento, sinta-se à vontade para me mandar uma mensagem!
      </p>

      <div className="t-contacts">
        {socials
          .filter((social) => social.is_visible !== false)
          .map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordClickAction("contact", social.platform)}
              className="t-contact"
              style={{ "--brand-color": social.brand_color } as CSSProperties}
            >
              <span className="t-contact__icon">
                <i className={social.icon} aria-hidden="true"></i>
              </span>
              <span className="t-contact__details">
                <span className="t-contact__title">{social.title}</span>
                <span className="t-contact__subtitle">{social.subtitle}</span>
              </span>
              <span className="t-contact__arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
      </div>

      <footer className="t-footer">
        <p>
          logout — sessão encerrada. Feito sob efeito de cafeína ☕ © 2026 Lucas Viana
          <span className="t-cursor" aria-hidden="true">
            ▍
          </span>
        </p>
      </footer>
    </>
  );
}
