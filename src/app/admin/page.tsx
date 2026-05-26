import { redirect } from "next/navigation";
import { getSqlClient } from "@/lib/db";
import { isAuthenticated } from "./actions";
import AdminDashboardClient from "./AdminDashboardClient";

// Force dynamic server rendering for secure admin portal
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // 1. Secure Authentication Gate
  const admin = await isAuthenticated();
  if (!admin) {
    redirect("/admin/login");
  }

  const sql = getSqlClient();
  
  // If database credentials are missing in the environment, show a setup screen
  if (!sql) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold">Banco de Dados Desconectado</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            As variáveis de ambiente do banco de dados (<code className="font-mono text-foreground">POSTGRES_URL</code>) não foram encontradas.
          </p>
          <p className="text-sm text-muted-foreground">
            Conecte a integração <strong>Vercel Postgres</strong> ao seu projeto.
          </p>
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground underline">
            ← Voltar ao site
          </a>
        </div>
      </div>
    );
  }

  // 2. Fetch Data with safe fallback in case tables do not exist yet
  let profile = null;
  let projects: any[] = [];
  let experience: any[] = [];
  let socials: any[] = [];
  let isDbInitialized = false;

  try {
    const profileRes = await sql`SELECT * FROM profile WHERE id = 'default' LIMIT 1;`;
    if (profileRes.length > 0) {
      profile = profileRes[0];
      projects = await sql`SELECT * FROM projects ORDER BY order_index ASC;`;
      experience = await sql`SELECT * FROM experience ORDER BY order_index ASC;`;
      socials = await sql`SELECT * FROM social_links ORDER BY order_index ASC;`;
      isDbInitialized = true;
    }
  } catch (error) {
    console.log("Database tables are not initialized yet:", error);
    isDbInitialized = false;
  }

  return (
    <AdminDashboardClient 
      isDbInitialized={isDbInitialized}
      initialProfile={profile}
      initialProjects={projects}
      initialExperience={experience}
      initialSocials={socials}
    />
  );
}
