import { PromptHeader } from "../PromptHeader";
import { TermWindow } from "../TermWindow";
import type { Project } from "../types";

interface ProjectsProps {
  projects: Project[];
}

export function Projects({ projects }: ProjectsProps) {
  return (
    <>
      <PromptHeader command="ls projetos/" title="Projetos em Destaque" />
      <div className="t-projects">
        {projects.map((project) => (
          <TermWindow key={project.id} path={`~/projetos/${project.id}`} className="t-project">
            <span className="t-project__category">{project.category}</span>
            <h3 className="t-project__title">{project.title}</h3>
            <p className="t-project__desc">{project.description}</p>
            <ul className="t-project__tags">
              {project.tags.map((tag, index) => (
                <li key={`${tag}-${index}`}>[{tag}]</li>
              ))}
            </ul>
            <div className="t-project__actions">
              {project.secondary_link && (
                <a href={project.secondary_link} target="_blank" rel="noopener noreferrer" className="t-link">
                  {project.secondary_link_label === "Figma" ? (
                    <i className="fa-brands fa-figma" aria-hidden="true"></i>
                  ) : (
                    <i className="fa-brands fa-github" aria-hidden="true"></i>
                  )}{" "}
                  {project.secondary_link_label}
                </a>
              )}
              <a href={project.link_url} target="_blank" rel="noopener noreferrer" className="t-link t-link--primary">
                {project.link_label} <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              </a>
            </div>
          </TermWindow>
        ))}
      </div>
    </>
  );
}
