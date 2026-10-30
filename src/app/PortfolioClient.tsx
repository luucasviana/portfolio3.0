"use client";

import React, { useEffect, useRef } from "react";
import type { Company, Profile, Project, SocialLink } from "./_portfolio/types";
import { Dock } from "./_portfolio/Dock";
import { HeroScene } from "./_portfolio/HeroScene";
import { Hero } from "./_portfolio/Hero";
import { About } from "./_portfolio/sections/About";
import { Skills } from "./_portfolio/sections/Skills";
import { Projects } from "./_portfolio/sections/Projects";
import { Contact } from "./_portfolio/sections/Contact";
import { BootIntro } from "./_portfolio/BootIntro";
import "./_portfolio/terminal.css";

interface PortfolioClientProps {
  initialProfile: Profile;
  initialProjects: Project[];
  initialExperience: Company[];
  initialSocials: SocialLink[];
}

export default function PortfolioClient({
  initialProfile,
  initialProjects,
  initialExperience,
  initialSocials
}: PortfolioClientProps) {
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

    return () => {
      document.removeEventListener("mousemove", handleMouseMoveGlow);
    };
  }, []);

  useEffect(() => {
    // --------------------------------------------------------------------------
    // 2. INTERSECTION OBSERVER (NAVIGATION SYNC & IN-VIEW ANIMATIONS)
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
    <div className="term">
      <BootIntro />
      {/* Subtle Dynamic Background Glow */}
      <div className="bg-glow" ref={bgGlowRef} id="bgGlow"></div>

      <div className="app-container">
        <HeroScene />
        <Dock github={showGithubInSidebar ? githubLink : undefined} onNavigate={handleNavClick} />

        {/* Right Content Area */}
        <main className="content-area">
          
          {/* HOME SECTION */}
          <section id="home" className="content-section">
            <Hero profile={initialProfile} onNavigate={handleNavClick} />
          </section>

          {/* SOBRE SECTION */}
          <section id="sobre" className="content-section">
            <About profile={initialProfile} experience={initialExperience} />
          </section>

          <section id="habilidades" className="content-section">
            <Skills />
          </section>

          <section id="projetos" className="content-section">
            <Projects projects={initialProjects} />
          </section>

          <section id="contatos" className="content-section">
            <Contact socials={initialSocials} />
          </section>
        </main>
      </div>
    </div>
  );
}
