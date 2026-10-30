import { PromptHeader } from "../PromptHeader";
import { TermWindow } from "../TermWindow";
import type { SkillCategory } from "../types";

const skillCategories: SkillCategory[] = [
  {
    id: "desenvolvimento",
    title: "Desenvolvimento",
    color: "#00adb5",
    icon: "fa-solid fa-laptop-code",
    skills: ["Bubble", "APIs REST", "Estruturação de banco de dados"]
  },
  {
    id: "design",
    title: "Design",
    color: "#a29bfe",
    icon: "fa-solid fa-palette",
    skills: ["UI Design", "UX Design", "Design Systems"]
  },
  {
    id: "produto",
    title: "Produto",
    color: "#00b894",
    icon: "fa-solid fa-cubes",
    skills: ["Organização de regras de negócio", "Construção de MVPs", "Visão de escalabilidade"]
  },
  {
    id: "diferenciais",
    title: "Diferenciais",
    color: "#fdcb6e",
    icon: "fa-solid fa-bolt",
    skills: [
      "Perfil híbrido entre dev e design",
      "Forte foco em experiência do usuário (UX)",
      "Agilidade na validação de produtos"
    ]
  }
];

export function Skills() {
  return (
    <>
      <PromptHeader command="ls skills/" title="Especialidades & Diferenciais" />
      <div className="t-skills">
        {skillCategories.map((category) => (
          <TermWindow key={category.id} path={`~/skills/${category.id}/`} accent={category.color}>
            <h3 className="t-skills__title">
              <i className={category.icon} aria-hidden="true"></i> {category.id}/
            </h3>
            <ul className="t-tree">
              {category.skills.map((skill, index) => (
                <li key={`${skill}-${index}`}>
                  {index === category.skills.length - 1 ? "└── " : "├── "}
                  {skill}
                </li>
              ))}
            </ul>
          </TermWindow>
        ))}
      </div>
    </>
  );
}
