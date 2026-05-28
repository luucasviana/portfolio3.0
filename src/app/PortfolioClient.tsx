"use client";

import React, { useEffect, useRef } from "react";
import { recordClickAction } from "./admin/analytics";

// Types for structural clarity
interface Project {
  id: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  link_url: string;
  link_label: string;
  secondary_link?: string;
  secondary_link_label?: string;
}

interface SkillCategory {
  id: string;
  title: string;
  color: string;
  icon: string;
  skills: string[];
}

interface Company {
  id: string;
  company_name: string;
  logo_text: string;
  logo_url?: string;
}

interface SocialLink {
  id: string;
  platform: string;
  icon: string;
  title: string;
  subtitle: string;
  url: string;
  brand_color: string;
  is_visible: boolean;
}

interface Profile {
  name: string;
  subtitle: string;
  description: string;
  bio_p1: string;
  bio_p2: string;
  bio_p3: string;
  cv_url?: string;
  certificate_bubble_url?: string;
  cv_visible?: boolean;
  certificate_bubble_visible?: boolean;
}

interface PortfolioClientProps {
  initialProfile: Profile;
  initialProjects: Project[];
  initialExperience: Company[];
  initialSocials: SocialLink[];
}

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

export default function PortfolioClient({
  initialProfile,
  initialProjects,
  initialExperience,
  initialSocials
}: PortfolioClientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgGlowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // --------------------------------------------------------------------------
    // 1. DYNAMIC MOUSE RADIAL GLOW EFFECT
    // --------------------------------------------------------------------------
    const bgGlow = bgGlowRef.current;
    
    const handleMouseMoveGlow = (e: MouseEvent) => {
      if (bgGlow) {
        const x = e.clientX;
        const y = e.clientY;
        bgGlow.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(0, 173, 181, 0.06), transparent 80%)`;
      }
    };

    if (bgGlow && window.matchMedia("(hover: hover)").matches) {
      document.addEventListener("mousemove", handleMouseMoveGlow);
    }

    // --------------------------------------------------------------------------
    // 2. FLUID NEON GLOWING CURSOR TRAIL (CANVAS)
    // --------------------------------------------------------------------------
    const canvas = canvasRef.current;
    let animationFrameId: number;

    if (canvas && window.matchMedia("(hover: hover)").matches) {
      const ctx = canvas.getContext("2d");
      let points: Array<{ x: number; y: number; time: number }> = [];
      const maxPathLength = 150; // Max cumulative path length in pixels

      const resizeCanvas = () => {
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
      };
      
      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();

      const handleMouseMoveTrail = (e: MouseEvent) => {
        points.push({
          x: e.clientX,
          y: e.clientY,
          time: Date.now()
        });

        if (points.length > 40) {
          points.shift();
        }
      };

      window.addEventListener("mousemove", handleMouseMoveTrail);

      const drawTrail = () => {
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const now = Date.now();
          points = points.filter(p => now - p.time < 300);

          let cumulativeLength = 0;
          let trimmedPoints = [];

          for (let i = points.length - 1; i >= 0; i--) {
            trimmedPoints.unshift(points[i]);
            if (i < points.length - 1) {
              const dx = points[i].x - points[i + 1].x;
              const dy = points[i].y - points[i + 1].y;
              cumulativeLength += Math.sqrt(dx * dx + dy * dy);
              if (cumulativeLength > maxPathLength) {
                break;
              }
            }
          }
          points = trimmedPoints;

          if (points.length > 1) {
            for (let i = 1; i < points.length; i++) {
              const p1 = points[i - 1];
              const p2 = points[i];

              const progress = i / points.length;

              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);

              ctx.lineWidth = 1 + progress * 2.5;
              ctx.strokeStyle = `rgba(0, 173, 181, ${progress * 0.75})`;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";

              ctx.shadowBlur = progress * 10;
              ctx.shadowColor = "#00adb5";

              ctx.stroke();
            }
          }
        }
        animationFrameId = requestAnimationFrame(drawTrail);
      };

      drawTrail();

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        window.removeEventListener("mousemove", handleMouseMoveTrail);
        if (bgGlow) {
          document.removeEventListener("mousemove", handleMouseMoveGlow);
        }
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, []);

  useEffect(() => {
    // --------------------------------------------------------------------------
    // 3. INTERSECTION OBSERVER (NAVIGATION SYNC & IN-VIEW ANIMATIONS)
    // --------------------------------------------------------------------------
    const sections = document.querySelectorAll(".content-section");
    const navItems = document.querySelectorAll(".nav-item");

    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -40% 0px",
      threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add class for fade-in / slide-up animation
          entry.target.classList.add("in-view");

          // Update active status on left sidebar
          const currentSectionId = entry.target.id;
          navItems.forEach(item => {
            if (item.getAttribute("data-section") === currentSectionId) {
              item.classList.add("active");
            } else {
              item.classList.remove("active");
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => {
      sectionObserver.observe(section);
    });

    return () => {
      sections.forEach(section => {
        sectionObserver.unobserve(section);
      });
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      history.pushState(null, "", `#${sectionId}`);
    }
  };

  // Find GitHub link specifically for left navigation dock footer
  const githubLink = initialSocials.find(s => s.platform.toLowerCase() === "github");
  const showGithubInSidebar = githubLink && githubLink.is_visible;

  return (
    <>
      {/* Subtle Dynamic Background Glow */}
      <div className="bg-glow" ref={bgGlowRef} id="bgGlow"></div>
      
      {/* Fluid Glowing Cursor Trail Canvas */}
      <canvas ref={canvasRef} id="cursorTrail"></canvas>

      <div className="app-container">
        {/* Minimalist Left Navigation Dock */}
        <aside className="sidebar">
          <div className="logo">
            <a 
              href="#home" 
              onClick={(e) => handleNavClick(e, "home")} 
              className="logo-link"
            >
              LV<span>.</span>
            </a>
          </div>
          
          <nav className="nav-menu">
            <a 
              href="#home" 
              onClick={(e) => handleNavClick(e, "home")} 
              className="nav-item active" 
              data-section="home"
            >
              <i className="fa-solid fa-house"></i>
              <span className="nav-tooltip">Início</span>
            </a>
            <a 
              href="#sobre" 
              onClick={(e) => handleNavClick(e, "sobre")} 
              className="nav-item" 
              data-section="sobre"
            >
              <i className="fa-solid fa-user"></i>
              <span className="nav-tooltip">Sobre</span>
            </a>
            <a 
              href="#habilidades" 
              onClick={(e) => handleNavClick(e, "habilidades")} 
              className="nav-item" 
              data-section="habilidades"
            >
              <i className="fa-solid fa-code"></i>
              <span className="nav-tooltip">Habilidades</span>
            </a>
            <a 
              href="#projetos" 
              onClick={(e) => handleNavClick(e, "projetos")} 
              className="nav-item" 
              data-section="projetos"
            >
              <i className="fa-solid fa-briefcase"></i>
              <span className="nav-tooltip">Projetos</span>
            </a>
            <a 
              href="#contatos" 
              onClick={(e) => handleNavClick(e, "contatos")} 
              className="nav-item" 
              data-section="contatos"
            >
              <i className="fa-solid fa-envelope"></i>
              <span className="nav-tooltip">Contato</span>
            </a>
          </nav>

          {showGithubInSidebar && (
            <div className="sidebar-footer">
              <a 
                href={githubLink.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-mini"
              >
                <i className="fa-brands fa-github"></i>
              </a>
            </div>
          )}
        </aside>

        {/* Right Content Area */}
        <main className="content-area">
          
          {/* HOME SECTION */}
          <section id="home" className="content-section">
            <div className="hero-container">
              <span className="hero-intro">Olá, eu sou</span>
              <h1 className="hero-title">{initialProfile.name || "Lucas Viana"}</h1>
              <h2 className="hero-subtitle">{initialProfile.subtitle || "Desenvolvedor & Designer UI"}<span>.</span></h2>
              <p className="hero-description">
                {initialProfile.description}
              </p>
              <div className="hero-actions">
                {initialProfile.cv_url && initialProfile.cv_visible !== false && (
                  <a 
                    href={`/api/download?url=${encodeURIComponent(initialProfile.cv_url)}`} 
                    onClick={() => recordClickAction("cv")}
                    className="btn btn-primary"
                  >
                    <i className="fa-solid fa-download"></i> Download CV
                  </a>
                )}
                {initialProfile.certificate_bubble_url && initialProfile.certificate_bubble_visible !== false && (
                  <a 
                    href={`/api/download?url=${encodeURIComponent(initialProfile.certificate_bubble_url)}`} 
                    onClick={() => recordClickAction("certificate")}
                    className="btn btn-secondary"
                  >
                    <i className="fa-solid fa-award"></i> Certificado Bubble
                  </a>
                )}
                <a 
                  href="#projetos" 
                  onClick={(e) => handleNavClick(e, "projetos")} 
                  className="btn btn-secondary nav-trigger"
                >
                  Ver Projetos <i className="fa-solid fa-arrow-right"></i>
                </a>
              </div>
            </div>
          </section>

          {/* SOBRE SECTION */}
          <section id="sobre" className="content-section">
            <div className="section-header">
              <span className="section-tag">01 / SOBRE MIM</span>
              <h2 className="section-title">Minha Trajetória</h2>
            </div>
            <div className="about-content">
              <div className="about-text">
                <p>{initialProfile.bio_p1}</p>
                <p>{initialProfile.bio_p2}</p>
                <p>{initialProfile.bio_p3}</p>
              </div>
              
              {initialExperience && initialExperience.length > 0 && (
                <div className="experience-carousel-container">
                  <span className="carousel-title">Empresas & Experiência</span>
                  <div className="vertical-carousel-wrapper">
                    <div className="vertical-carousel-track">
                      {/* First logo list */}
                      {initialExperience.map((company, index) => (
                        <div className="carousel-item-logo" key={`logo-1-${index}`}>
                          <span className="logo-text">{company.logo_text}</span>
                        </div>
                      ))}
                      {/* Duplicated logo list for infinite loop */}
                      {initialExperience.map((company, index) => (
                        <div className="carousel-item-logo" key={`logo-2-${index}`}>
                          <span className="logo-text">{company.logo_text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* HABILIDADES / COMPETÊNCIAS SECTION */}
          <section id="habilidades" className="content-section">
            <div className="section-header">
              <span className="section-tag">02 / COMPETÊNCIAS</span>
              <h2 className="section-title">Especialidades & Diferenciais</h2>
            </div>
            
            <div className="skills-grid">
              {skillCategories.map((category) => (
                <div 
                  className="skill-category-card" 
                  style={{ "--card-color": category.color } as React.CSSProperties}
                  key={category.id}
                >
                  <div className="category-header">
                    <div className="category-icon">
                      <i className={category.icon}></i>
                    </div>
                    <h3 className="category-title">{category.title}</h3>
                  </div>
                  <ul className="category-skills-list">
                    {category.skills.map((skill, index) => (
                      <li key={index}>
                        <i className="fa-solid fa-circle-check"></i> {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* PROJETOS SECTION */}
          <section id="projetos" className="content-section">
            <div className="section-header">
              <span className="section-tag">03 / TRABALHOS</span>
              <h2 className="section-title">Projetos em Destaque</h2>
            </div>
            
            <div className="projects-grid">
              {initialProjects.map((project) => (
                <article className="project-card" key={project.id}>
                  <div className="project-info">
                    <span className="project-category">{project.category}</span>
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-desc">{project.description}</p>
                    <div className="project-tags">
                      {project.tags.map((tag, index) => (
                        <span key={index}>{tag}</span>
                      ))}
                    </div>
                    <div className="project-actions">
                      {project.secondary_link && (
                        <a 
                          href={project.secondary_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="project-link link-secondary"
                        >
                          {project.secondary_link_label === "Figma" ? (
                            <i className="fa-brands fa-figma"></i>
                          ) : (
                            <i className="fa-brands fa-github"></i>
                          )} {project.secondary_link_label}
                        </a>
                      )}
                      <a 
                        href={project.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="project-link btn-glow"
                      >
                        {project.link_label} <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* CONTATO SECTION */}
          <section id="contatos" className="content-section">
            <div className="section-header">
              <span className="section-tag">04 / CONEXÃO</span>
              <h2 className="section-title">Vamos conversar?</h2>
            </div>
            
            <p className="contact-intro">
              Se você tem um projeto em mente, precisa de um desenvolvedor dedicado para a sua equipe, ou quer apenas trocar uma ideia sobre desenvolvimento front-end, sinta-se à vontade para me mandar uma mensagem!
            </p>
            
            <div className="contact-grid">
              {initialSocials
                .filter((social) => social.is_visible !== false)
                .map((social) => (
                  <a 
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => recordClickAction("contact", social.platform)}
                    className="contact-card" 
                    style={{ "--brand-color": social.brand_color } as React.CSSProperties}
                    key={social.id}
                  >
                    <div className="contact-icon">
                      <i className={social.icon}></i>
                    </div>
                    <div className="contact-details">
                      <h3>{social.title}</h3>
                      <p>{social.subtitle}</p>
                    </div>
                    <span className="contact-action">
                      <i className="fa-solid fa-arrow-right"></i>
                    </span>
                  </a>
                ))}
            </div>

            <footer className="app-footer">
              <p>Totalmente feito sob o efeito de cafeína. <i className="fa-solid fa-mug-hot animated-mug"></i></p>
              <p>© 2026 | <span>Lucas Viana</span></p>
            </footer>
          </section>
        </main>
      </div>
    </>
  );
}
