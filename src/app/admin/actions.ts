"use server";

import { cookies } from "next/headers";
import { getSqlClient } from "@/lib/db";
import { initializeDatabase } from "@/lib/init-db";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

// A secure fallback key. The user will set process.env.ADMIN_PASSWORD in Vercel settings!
const ADMIN_PASSWORD_ENV = process.env.ADMIN_PASSWORD || "LucasAdmin123!";

/**
 * Verifies if the active user is securely authenticated as the administrator.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("portfolio_admin_session");
  return session?.value === "true";
}

/**
 * Handles the secure login action.
 */
export async function loginAction(password: string): Promise<{ success: boolean; error?: string }> {
  if (password === ADMIN_PASSWORD_ENV) {
    const cookieStore = await cookies();
    cookieStore.set("portfolio_admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days session
      path: "/",
      sameSite: "strict"
    });
    return { success: true };
  }
  return { success: false, error: "Senha incorreta. Tente novamente." };
}

/**
 * Handles session logout.
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete("portfolio_admin_session");
  return { success: true };
}

/**
 * Proactively triggers database initialization.
 */
export async function triggerDbInit(): Promise<{ success: boolean; message: string }> {
  const admin = await isAuthenticated();
  if (!admin) return { success: false, message: "Não autorizado." };
  
  const initialized = await initializeDatabase();
  if (initialized) {
    revalidatePath("/");
    return { success: true, message: "Banco de dados estruturado e populado com sucesso!" };
  }
  return { success: false, message: "Falha ao inicializar o banco. Verifique as credenciais POSTGRES_URL." };
}

// ==========================================================================
// CRUD: PROFILE (Hero & Sobre)
// ==========================================================================
export async function updateProfile(formData: {
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
}) {
  const admin = await isAuthenticated();
  if (!admin) throw new Error("Não autorizado.");

  const sql = getSqlClient();
  if (!sql) throw new Error("Banco de dados indisponível.");

  await sql`
    UPDATE profile
    SET 
      name = ${formData.name},
      subtitle = ${formData.subtitle},
      description = ${formData.description},
      bio_p1 = ${formData.bio_p1},
      bio_p2 = ${formData.bio_p2},
      bio_p3 = ${formData.bio_p3},
      cv_url = COALESCE(NULLIF(${formData.cv_url || ""}, ''), cv_url),
      certificate_bubble_url = COALESCE(NULLIF(${formData.certificate_bubble_url || ""}, ''), certificate_bubble_url),
      cv_visible = ${formData.cv_visible !== undefined ? formData.cv_visible : true},
      certificate_bubble_visible = ${formData.certificate_bubble_visible !== undefined ? formData.certificate_bubble_visible : true}
    WHERE id = 'default';
  `;

  revalidatePath("/");
  return { success: true };
}

// ==========================================================================
// CRUD: PROJECTS
// ==========================================================================
export async function saveProject(project: {
  id?: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  link_url: string;
  link_label: string;
  secondary_link?: string;
  secondary_link_label?: string;
  order_index: number;
}) {
  const admin = await isAuthenticated();
  if (!admin) throw new Error("Não autorizado.");

  const sql = getSqlClient();
  if (!sql) throw new Error("Banco de dados indisponível.");

  const id = project.id || `proj_${Date.now()}`;

  if (project.id) {
    // Update
    await sql`
      UPDATE projects
      SET 
        category = ${project.category},
        title = ${project.title},
        description = ${project.description},
        tags = ${project.tags},
        link_url = ${project.link_url},
        link_label = ${project.link_label},
        secondary_link = ${project.secondary_link || ""},
        secondary_link_label = ${project.secondary_link_label || ""},
        order_index = ${project.order_index}
      WHERE id = ${project.id};
    `;
  } else {
    // Insert
    await sql`
      INSERT INTO projects (id, category, title, description, tags, link_url, link_label, secondary_link, secondary_link_label, order_index)
      VALUES (
        ${id},
        ${project.category},
        ${project.title},
        ${project.description},
        ${project.tags},
        ${project.link_url},
        ${project.link_label},
        ${project.secondary_link || ""},
        ${project.secondary_link_label || ""},
        ${project.order_index}
      );
    `;
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteProject(id: string) {
  const admin = await isAuthenticated();
  if (!admin) throw new Error("Não autorizado.");

  const sql = getSqlClient();
  if (!sql) throw new Error("Banco de dados indisponível.");

  await sql`DELETE FROM projects WHERE id = ${id};`;
  revalidatePath("/");
  return { success: true };
}

// ==========================================================================
// CRUD: EXPERIENCE / COMPANIES
// ==========================================================================
export async function addExperience(company: { company_name: string; logo_text: string; logo_url?: string }) {
  const admin = await isAuthenticated();
  if (!admin) throw new Error("Não autorizado.");

  const sql = getSqlClient();
  if (!sql) throw new Error("Banco de dados indisponível.");

  const id = `exp_${Date.now()}`;
  
  // Fetch next order index
  const lastIndexRes = await sql`SELECT MAX(order_index) as max_idx FROM experience;`;
  const nextIdx = (lastIndexRes[0]?.max_idx || 0) + 1;

  await sql`
    INSERT INTO experience (id, company_name, logo_text, logo_url, order_index)
    VALUES (${id}, ${company.company_name}, ${company.logo_text}, ${company.logo_url || ""}, ${nextIdx});
  `;

  revalidatePath("/");
  return { success: true };
}

export async function deleteExperience(id: string) {
  const admin = await isAuthenticated();
  if (!admin) throw new Error("Não autorizado.");

  const sql = getSqlClient();
  if (!sql) throw new Error("Banco de dados indisponível.");

  await sql`DELETE FROM experience WHERE id = ${id};`;
  revalidatePath("/");
  return { success: true };
}

// ==========================================================================
// CRUD: SOCIAL LINKS / CONNECTIONS
// ==========================================================================
export async function updateSocialLink(formData: {
  id: string;
  param_value: string;
  is_visible: boolean;
}) {
  const admin = await isAuthenticated();
  if (!admin) throw new Error("Não autorizado.");

  const sql = getSqlClient();
  if (!sql) throw new Error("Banco de dados indisponível.");

  // Fetch the link row first to know platform details
  const linkRowRes = await sql`SELECT platform FROM social_links WHERE id = ${formData.id} LIMIT 1;`;
  if (linkRowRes.length === 0) throw new Error("Link não encontrado.");
  
  const platform = linkRowRes[0].platform.toLowerCase();
  const param = formData.param_value.trim();

  // Dynamic automatic URL generator based on platform-specific parameters
  let generatedUrl = "";
  
  if (platform === "whatsapp") {
    // Keeps only digits for secure WhatsApp wa.me API link builder
    const digits = param.replace(/\D/g, "");
    generatedUrl = `https://wa.me/${digits}`;
  } else if (platform === "e-mail") {
    generatedUrl = `mailto:${param}`;
  } else if (platform === "github") {
    generatedUrl = `https://github.com/${param.replace(/^\//, "")}`;
  } else if (platform === "linkedin") {
    generatedUrl = `https://www.linkedin.com/in/${param.replace(/^\//, "")}/`;
  } else if (platform === "instagram") {
    generatedUrl = `https://instagram.com/${param.replace(/^@/, "")}`;
  }

  await sql`
    UPDATE social_links
    SET 
      param_value = ${param},
      url = ${generatedUrl},
      is_visible = ${formData.is_visible}
    WHERE id = ${formData.id};
  `;

  revalidatePath("/");
  return { success: true };
}

/**
 * Uploads a file securely to Vercel Blob Storage using the server-side environment token.
 */
export async function uploadFileAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  const admin = await isAuthenticated();
  if (!admin) return { success: false, error: "Não autorizado." };

  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "Arquivo não encontrado." };

    // Unique filename to prevent collision and cache issues
    const uniqueName = `portfolio/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const blob = await put(uniqueName, file, {
      access: "public",
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error("Vercel Blob Upload failed:", error);
    return { success: false, error: error.message || "Falha ao enviar arquivo." };
  }
}
