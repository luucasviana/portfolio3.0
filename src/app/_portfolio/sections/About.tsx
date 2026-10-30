import { PromptHeader } from "../PromptHeader";
import { TermWindow } from "../TermWindow";
import type { Company, Profile } from "../types";

interface AboutProps {
  profile: Profile;
  experience: Company[];
}

export function About({ profile, experience }: AboutProps) {
  return (
    <>
      <PromptHeader command="whoami" title="Minha Trajetória" />
      <div className="t-about">
        <TermWindow path="~/sobre.md">
          <div className="t-about__bio">
            <p>{profile.bio_p1}</p>
            <p>{profile.bio_p2}</p>
            <p>{profile.bio_p3}</p>
          </div>
        </TermWindow>

        {experience && experience.length > 0 && (
          <TermWindow path="~/log/empresas" className="t-log">
            <span className="t-log__title">Empresas & Experiência</span>
            <div className="t-log__viewport">
              <ul className="t-log__track">
                {/* list rendered twice for a seamless infinite loop */}
                {[...experience, ...experience].map((company, index) => (
                  <li key={`${company.id}-${index}`} aria-hidden={index >= experience.length || undefined}>
                    <span className="t-log__caret">&gt;</span> {company.logo_text}
                  </li>
                ))}
              </ul>
            </div>
          </TermWindow>
        )}
      </div>
    </>
  );
}
