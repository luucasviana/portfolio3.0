import { getSqlClient } from "./db";

/**
 * Initializes the database tables if they do not exist and seeds them with
 * the highly refined default profile, project, and social links data.
 */
export async function initializeDatabase() {
  const sql = getSqlClient();
  if (!sql) {
    console.log("Database client is not available yet (Skipping initialization).");
    return false;
  }

  try {
    // 1. Create tables if they do not exist
    await sql`
      CREATE TABLE IF NOT EXISTS profile (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        subtitle VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        bio_p1 TEXT NOT NULL,
        bio_p2 TEXT NOT NULL,
        bio_p3 TEXT NOT NULL,
        cv_url VARCHAR(255) DEFAULT '',
        certificate_bubble_url VARCHAR(255) DEFAULT '',
        cv_visible BOOLEAN DEFAULT TRUE,
        certificate_bubble_visible BOOLEAN DEFAULT TRUE
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(50) PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        tags VARCHAR(100)[] NOT NULL,
        link_url VARCHAR(255) NOT NULL,
        link_label VARCHAR(100) NOT NULL,
        secondary_link VARCHAR(255) DEFAULT '',
        secondary_link_label VARCHAR(100) DEFAULT '',
        order_index INT DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS experience (
        id VARCHAR(50) PRIMARY KEY,
        company_name VARCHAR(100) NOT NULL,
        logo_text VARCHAR(100) NOT NULL,
        logo_url VARCHAR(255) DEFAULT '',
        order_index INT DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS social_links (
        id VARCHAR(50) PRIMARY KEY,
        platform VARCHAR(50) NOT NULL,
        icon VARCHAR(100) NOT NULL,
        title VARCHAR(100) NOT NULL,
        subtitle VARCHAR(150) NOT NULL,
        url VARCHAR(255) DEFAULT '',
        param_value VARCHAR(100) NOT NULL,
        brand_color VARCHAR(50) NOT NULL,
        is_visible BOOLEAN DEFAULT TRUE,
        order_index INT DEFAULT 0
      );
    `;

    // 2. Check if already seeded to prevent duplicate operations
    const profiles = await sql`SELECT * FROM profile LIMIT 1;`;
    if (profiles.length === 0) {
      console.log("Seeding default profile data...");
      
      // Seed profile
      await sql`
        INSERT INTO profile (id, name, subtitle, description, bio_p1, bio_p2, bio_p3)
        VALUES (
          'default',
          'Lucas Viana',
          'Desenvolvedor & Designer UI',
          'Especializado em unir design intuitivo e desenvolvimento de alto nível para criar sistemas modernos, funcionais e totalmente focados na melhor experiência de usuário.',
          'Sou desenvolvedor e designer UI apaixonado por transformar ideias em produtos digitais que realmente funcionam na prática. Comecei trabalhando com Bubble e, ao longo do tempo, fui unindo cada vez mais desenvolvimento, design e estratégia de produto no mesmo processo.',
          'Hoje, meu foco é criar sistemas modernos, intuitivos e bem estruturados — desde plataformas SaaS e dashboards administrativos até aplicativos completos com integrações e experiências personalizadas.',
          'Gosto de pensar além da interface: entender o problema, organizar a experiência do usuário e construir soluções que façam sentido tanto para quem usa quanto para quem gerencia o produto.'
        );
      `;

      // Seed projects
      await sql`
        INSERT INTO projects (id, category, title, description, tags, link_url, link_label, secondary_link, secondary_link_label, order_index)
        VALUES 
        (
          'ecoaai',
          'SaaS B2B / IA',
          'Ecoaai',
          'Copiloto criativo de automação de marketing digital focado em nichos altamente visuais. Com um motor de Continuous Learning, a inteligência artificial memoriza a identidade verbal e visual da marca, gerando layouts 100% dinâmicos em tempo real e integrando agendamentos e postagens automáticas direto no Instagram.',
          ARRAY['Inteligência Artificial', 'Continuous Learning', 'Marketing Automation', 'SaaS B2B'],
          'https://ecoaai.com',
          'Conhecer o SaaS',
          '',
          '',
          0
        ),
        (
          'adotepet',
          'Full-Stack / Plataforma',
          'AdotePet',
          'Plataforma full-stack para adoção e proteção animal criada com React, TypeScript, Vite e Supabase. O sistema conecta adotantes, ONGs, parceiros e administradores com recursos de cadastro de pets, mapas interativos de resgate, painéis administrativos e segurança integrada.',
          ARRAY['React', 'TypeScript', 'Supabase', 'Vite', 'Playwright'],
          '#',
          'Conhecer Plataforma',
          'https://www.figma.com/design/RoQJ0sogdFuygnQz7IkXLQ/ADOTEPET?t=lImVqvAgmLcyFzT1-1',
          'Figma',
          1
        ),
        (
          'financeiro',
          'Full-Stack / SaaS',
          'Controle Financeiro',
          'Aplicação web de controle financeiro pessoal criada com Next.js, TypeScript e Supabase. Permite gerenciar receitas, despesas, cartões, parcelamentos e meses financeiros personalizados, com dashboard de métricas, gráficos e projeções para apoiar o planejamento mensal.',
          ARRAY['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS', 'shadcn/ui'],
          'https://financial-ctr.netlify.app/',
          'Acessar App',
          'https://github.com/luucasviana/financial-control',
          'Código',
          2
        );
      `;

      // Seed default experience logos
      await sql`
        INSERT INTO experience (id, company_name, logo_text, order_index)
        VALUES 
        ('exp1', 'InfoEduc', 'InfoEduc', 0),
        ('exp2', 'Ecoaai', 'Ecoaai', 1),
        ('exp3', 'BubbleStudio', 'BubbleStudio', 2),
        ('exp4', 'Freelance', 'Freelance', 3);
      `;

      // Seed default social links
      await sql`
        INSERT INTO social_links (id, platform, icon, title, subtitle, url, param_value, brand_color, is_visible, order_index)
        VALUES 
        ('whats', 'WhatsApp', 'fa-brands fa-whatsapp', 'WhatsApp', 'Conversar diretamente', 'https://wa.me/5512997741275', '+5512997741275', '#25d366', true, 0),
        ('mail', 'E-mail', 'fa-solid fa-envelope', 'E-mail', 'jose.lucas.viana@gmail.com', 'mailto:jose.lucas.viana@gmail.com', 'jose.lucas.viana@gmail.com', '#ea4335', true, 1),
        ('git', 'GitHub', 'fa-brands fa-github', 'GitHub', '/luucasviana', 'https://github.com/luucasviana', 'luucasviana', '#ffffff', true, 2),
        ('link', 'LinkedIn', 'fa-brands fa-linkedin-in', 'LinkedIn', 'jose-lucas-menezes', 'https://www.linkedin.com/in/jose-lucas-menezes/', 'jose-lucas-menezes', '#0077b5', true, 3),
        ('insta', 'Instagram', 'fa-brands fa-instagram', 'Instagram', '@luucasviana', 'https://instagram.com/luucasviana', 'luucasviana', '#e1306c', true, 4);
      `;
      
      console.log("Database seeded successfully.");
    }
    
    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
}
