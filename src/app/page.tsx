import { getSqlClient } from "@/lib/db";
import { headers } from "next/headers";
import { parseUserAgent } from "./admin/analytics";
import PortfolioClient from "./PortfolioClient";

// Force dynamic server rendering to reflect admin panel visibility and text updates instantly
export const dynamic = "force-dynamic";

// Hardcoded fallback data in case DB is not reachable or not initialized yet
const fallbackProfile = {
  name: "Lucas Viana",
  subtitle: "Desenvolvedor & Designer UI",
  description: "Especializado em unir design intuitivo e desenvolvimento de alto nível para criar sistemas modernos, funcionais e totalmente focados na melhor experiência de usuário.",
  bio_p1: "Sou desenvolvedor e designer UI apaixonado por transformar ideias em produtos digitais que realmente funcionam na prática. Comecei trabalhando com Bubble e, ao longo do tempo, fui unindo cada vez mais desenvolvimento, design e estratégia de produto no mesmo processo.",
  bio_p2: "Hoje, meu foco é criar sistemas modernos, intuitivos e bem estruturados — desde plataformas SaaS e dashboards administrativos até aplicativos completos com integrações e experiências personalizadas.",
  bio_p3: "Gosto de pensar além da interface: entender o problema, organizar a experiência do usuário e construir soluções que façam sentido tanto para quem usa quanto para quem gerencia o produto.",
  cv_url: "doc/Curriculo - 3.5.pdf",
  certificate_bubble_url: "doc/Certificado-Bubble.pdf",
  cv_visible: true,
  certificate_bubble_visible: true,
};

const fallbackProjects = [
  {
    id: "ecoaai",
    category: "SaaS B2B / IA",
    title: "Ecoaai",
    description: "Copiloto criativo de automação de marketing digital focado em nichos altamente visuais. Com um motor de Continuous Learning, a inteligência artificial memoriza a identidade verbal e visual da marca, gerando layouts 100% dinâmicos em tempo real e integrando agendamentos e postagens automáticas direto no Instagram.",
    tags: ["Inteligência Artificial", "Continuous Learning", "Marketing Automation", "SaaS B2B"],
    link_url: "https://ecoaai.com",
    link_label: "Conhecer o SaaS"
  },
  {
    id: "adotepet",
    category: "Full-Stack / Plataforma",
    title: "AdotePet",
    description: "Plataforma full-stack para adoção e proteção animal criada com React, TypeScript, Vite e Supabase. O sistema conecta adotantes, ONGs, parceiros e administradores com recursos de cadastro de pets, mapas interativos de resgate, painéis administrativos e segurança integrada.",
    tags: ["React", "TypeScript", "Supabase", "Vite", "Playwright"],
    link_url: "#",
    link_label: "Conhecer Plataforma",
    secondary_link: "https://www.figma.com/design/RoQJ0sogdFuygnQz7IkXLQ/ADOTEPET?t=lImVqvAgmLcyFzT1-1",
    secondary_link_label: "Figma"
  },
  {
    id: "financeiro",
    category: "Full-Stack / SaaS",
    title: "Controle Financeiro",
    description: "Aplicação web de controle financeiro pessoal criada com Next.js, TypeScript e Supabase. Permite gerenciar receitas, despesas, cartões, parcelamentos e meses financeiros personalizados, com dashboard de métricas, gráficos e projeções para apoiar o planejamento mensal.",
    tags: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "shadcn/ui"],
    link_url: "https://financial-ctr.netlify.app/",
    link_label: "Acessar App",
    secondary_link: "https://github.com/luucasviana/financial-control",
    secondary_link_label: "Código"
  }
];

const fallbackExperience = [
  { id: "exp1", company_name: "InfoEduc", logo_text: "InfoEduc" },
  { id: "exp2", company_name: "Ecoaai", logo_text: "Ecoaai" },
  { id: "exp3", company_name: "BubbleStudio", logo_text: "BubbleStudio" },
  { id: "exp4", company_name: "Freelance", logo_text: "Freelance" }
];

const fallbackSocials = [
  { id: "whats", platform: "WhatsApp", icon: "fa-brands fa-whatsapp", title: "WhatsApp", subtitle: "Conversar diretamente", url: "https://wa.me/5512997741275", brand_color: "#25d366", is_visible: true },
  { id: "mail", platform: "E-mail", icon: "fa-solid fa-envelope", title: "E-mail", subtitle: "jose.lucas.viana@gmail.com", url: "mailto:jose.lucas.viana@gmail.com", brand_color: "#ea4335", is_visible: true },
  { id: "git", platform: "GitHub", icon: "fa-brands fa-github", title: "GitHub", subtitle: "/luucasviana", url: "https://github.com/luucasviana", brand_color: "#ffffff", is_visible: true },
  { id: "link", platform: "LinkedIn", icon: "fa-brands fa-linkedin-in", title: "LinkedIn", subtitle: "jose-lucas-menezes", url: "https://www.linkedin.com/in/jose-lucas-menezes/", brand_color: "#0077b5", is_visible: true },
  { id: "insta", platform: "Instagram", icon: "fa-brands fa-instagram", title: "Instagram", subtitle: "@luucasviana", url: "https://instagram.com/luucasviana", brand_color: "#e1306c", is_visible: true }
];

export default async function Home() {
  const sql = getSqlClient();
  const reqHeaders = await headers();

  // Try to record the visit in background
  if (sql) {
    try {
      const rawIp = reqHeaders.get("x-real-ip") || reqHeaders.get("x-forwarded-for") || "";
      const ip = rawIp.split(",")[0].trim() || "127.0.0.1";
      
      let city = reqHeaders.get("x-vercel-ip-city") || "Desconhecido";
      let region = reqHeaders.get("x-vercel-ip-country-region") || "Desconhecido";
      let country = reqHeaders.get("x-vercel-ip-country") || "Desconhecido";

      // ISO-8859-1 decoding for city
      if (city && city !== "Desconhecido") {
        try {
          city = decodeURIComponent(escape(city));
        } catch {
          // Fallback if not ISO encoded
        }
      }

      if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
        city = "Localhost";
        region = "Dev";
        country = "Local";
      }

      const ua = reqHeaders.get("user-agent") || "";
      const { device_type, browser } = await parseUserAgent(ua);

      let parsedReferrer = "Direto";
      const refHeader = reqHeaders.get("referer");
      if (refHeader) {
        try {
          const url = new URL(refHeader);
          const host = url.hostname.toLowerCase();
          if (host.includes("linkedin")) parsedReferrer = "LinkedIn";
          else if (host.includes("instagram")) parsedReferrer = "Instagram";
          else if (host.includes("github")) parsedReferrer = "GitHub";
          else if (host.includes("google")) parsedReferrer = "Google Search";
          else if (host.includes("facebook") || host.includes("fb")) parsedReferrer = "Facebook";
          else if (host.includes("t.co") || host.includes("twitter") || host.includes("x.com")) parsedReferrer = "X / Twitter";
          else parsedReferrer = url.hostname;
        } catch {
          parsedReferrer = refHeader.substring(0, 50);
        }
      }

      // Record the visit! Non-blocking
      sql`
        INSERT INTO visit_logs (ip_address, city, region, country, device_type, browser, referrer)
        VALUES (${ip}, ${city}, ${region}, ${country}, ${device_type}, ${browser}, ${parsedReferrer});
      `.catch(err => console.error("Failed to log visit:", err));

    } catch (e) {
      console.error("Failed to parse visit headers:", e);
    }
  }

  let profile = fallbackProfile;
  let projects = fallbackProjects;
  let experience = fallbackExperience;
  let socials = fallbackSocials;

  if (sql) {
    try {
      const profileRes = await sql`SELECT * FROM profile WHERE id = 'default' LIMIT 1;`;
      if (profileRes.length > 0) {
        profile = profileRes[0] as any;
        
        // Fetch projects sorted by order_index
        const projectsRes = await sql`SELECT * FROM projects ORDER BY order_index ASC;`;
        if (projectsRes.length > 0) {
          projects = projectsRes as any;
        }

        // Fetch experience sorted by order_index
        const expRes = await sql`SELECT * FROM experience ORDER BY order_index ASC;`;
        if (expRes.length > 0) {
          experience = expRes as any;
        }

        // Fetch socials sorted by order_index
        const socialsRes = await sql`SELECT * FROM social_links ORDER BY order_index ASC;`;
        if (socialsRes.length > 0) {
          socials = socialsRes as any;
        }
      }
    } catch (error) {
      console.error("Failed to query database, using fallbacks:", error);
    }
  }

  return (
    <PortfolioClient 
      initialProfile={profile}
      initialProjects={projects}
      initialExperience={experience}
      initialSocials={socials}
    />
  );
}
