"use client";

import React, { useState } from "react";
import { 
  updateProfile, 
  saveProject, 
  deleteProject, 
  addExperience, 
  deleteExperience, 
  updateSocialLink, 
  logoutAction, 
  triggerDbInit,
  uploadFileAction
} from "./actions";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface AdminDashboardClientProps {
  isDbInitialized: boolean;
  initialProfile: any;
  initialProjects: any[];
  initialExperience: any[];
  initialSocials: any[];
}

export default function AdminDashboardClient({
  isDbInitialized,
  initialProfile,
  initialProjects,
  initialExperience,
  initialSocials
}: AdminDashboardClientProps) {
  // Navigation tabs: 'profile' | 'projects' | 'experience' | 'socials'
  const [activeTab, setActiveTab] = useState<string>("profile");
  
  // Database initialization states
  const [dbLoading, setDbLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState("");
  
  // Profile states
  const [profile, setProfile] = useState(initialProfile || {
    name: "",
    subtitle: "",
    description: "",
    bio_p1: "",
    bio_p2: "",
    bio_p3: "",
    cv_url: "",
    certificate_bubble_url: ""
  });
  
  // Projects states
  const [projects, setProjects] = useState<any[]>(initialProjects || []);
  const [editingProject, setEditingProject] = useState<any | null>(null); // null means not editing, 'new' means adding new
  
  // Experience states
  const [experiences, setExperiences] = useState<any[]>(initialExperience || []);
  const [newExp, setNewExp] = useState({ company_name: "", logo_text: "", logo_url: "" });
  
  // Social links states
  const [socials, setSocials] = useState<any[]>(initialSocials || []);

  // UI status feedbacks
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" }); // type: 'success' | 'error'
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/admin/login";
  };

  // --------------------------------------------------------------------------
  // DATABASE INITIALIZATION HANDLER
  // --------------------------------------------------------------------------
  const handleDbInitialize = async () => {
    setDbLoading(true);
    setDbMessage("Estruturando tabelas e semeando dados de portfólio...");
    try {
      const res = await triggerDbInit();
      if (res.success) {
        setDbMessage(res.message);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setDbMessage("Erro: " + res.message);
        setDbLoading(false);
      }
    } catch (err: any) {
      setDbMessage("Erro: Falha na requisição. " + err.message);
      setDbLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // FILE UPLOAD HANDLER (Uses the secure server action with Vercel Blob!)
  // --------------------------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadFileAction(formData);
      if (res.success && res.url) {
        if (field === "cv") {
          setProfile({ ...profile, cv_url: res.url });
          showStatus("Currículo enviado com sucesso para o Vercel Blob!");
        } else if (field === "certificate") {
          setProfile({ ...profile, certificate_bubble_url: res.url });
          showStatus("Certificado Bubble enviado com sucesso!");
        } else if (field === "experience_logo") {
          setNewExp({ ...newExp, logo_url: res.url });
          showStatus("Imagem da logo enviada com sucesso!");
        } else if (field.startsWith("project_")) {
          // If editing a project, save the file url
          setEditingProject({ ...editingProject, link_url: res.url });
          showStatus("Arquivo do projeto enviado com sucesso!");
        }
      } else {
        showStatus(res.error || "Falha ao enviar arquivo.", "error");
      }
    } catch (err) {
      console.error(err);
      showStatus("Erro de conexão no upload.", "error");
    } finally {
      setUploadingField(null);
    }
  };

  // --------------------------------------------------------------------------
  // FORM SUBMISSIONS (PROFILE)
  // --------------------------------------------------------------------------
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateProfile(profile);
      if (res.success) {
        showStatus("Perfil e trajetória atualizados com sucesso!");
      }
    } catch (err: any) {
      showStatus(err.message || "Erro ao salvar perfil.", "error");
    }
  };

  // --------------------------------------------------------------------------
  // FORM SUBMISSIONS (PROJECTS)
  // --------------------------------------------------------------------------
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await saveProject({
        ...editingProject,
        // Make sure tags are stored as an array of strings
        tags: typeof editingProject.tags === "string" 
          ? editingProject.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
          : editingProject.tags
      });
      if (res.success) {
        showStatus(`Projeto "${editingProject.title}" salvo com sucesso!`);
        // Refresh local projects state
        const updatedProjects = [...projects];
        const existingIdx = projects.findIndex(p => p.id === editingProject.id);
        if (existingIdx !== -1) {
          updatedProjects[existingIdx] = editingProject;
        } else {
          updatedProjects.push({ ...editingProject, id: `proj_${Date.now()}` });
        }
        setProjects(updatedProjects);
        setEditingProject(null);
        // Soft refresh the page to update SSR state
        window.location.reload();
      }
    } catch (err: any) {
      showStatus(err.message || "Erro ao salvar projeto.", "error");
    }
  };

  const handleNewProjectClick = () => {
    setEditingProject({
      category: "",
      title: "",
      description: "",
      tags: "",
      link_url: "",
      link_label: "",
      secondary_link: "",
      secondary_link_label: "",
      order_index: projects.length
    });
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;
    try {
      const res = await deleteProject(id);
      if (res.success) {
        setProjects(projects.filter(p => p.id !== id));
        showStatus("Projeto excluído com sucesso!");
      }
    } catch (err: any) {
      showStatus(err.message || "Erro ao excluir projeto.", "error");
    }
  };

  // --------------------------------------------------------------------------
  // FORM SUBMISSIONS (EXPERIENCE)
  // --------------------------------------------------------------------------
  const handleExperienceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.company_name) return;
    
    try {
      const res = await addExperience(newExp);
      if (res.success) {
        showStatus("Empresa adicionada ao carrossel com sucesso!");
        setExperiences([...experiences, { ...newExp, id: `exp_${Date.now()}` }]);
        setNewExp({ company_name: "", logo_text: "", logo_url: "" });
        window.location.reload();
      }
    } catch (err: any) {
      showStatus(err.message || "Erro ao adicionar empresa.", "error");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta empresa?")) return;
    try {
      const res = await deleteExperience(id);
      if (res.success) {
        setExperiences(experiences.filter(exp => exp.id !== id));
        showStatus("Empresa removida com sucesso!");
      }
    } catch (err: any) {
      showStatus(err.message || "Erro ao remover empresa.", "error");
    }
  };

  // --------------------------------------------------------------------------
  // FORM SUBMISSIONS (SOCIAL LINKS / CONNECTIONS)
  // --------------------------------------------------------------------------
  const handleSocialSubmit = async (e: React.FormEvent, social: any) => {
    e.preventDefault();
    try {
      const res = await updateSocialLink({
        id: social.id,
        param_value: social.param_value,
        is_visible: social.is_visible
      });
      if (res.success) {
        showStatus(`Conexão do ${social.platform} atualizada com sucesso!`);
      }
    } catch (err: any) {
      showStatus(err.message || "Erro ao salvar rede social.", "error");
    }
  };

  const handleSocialChange = (id: string, field: string, value: any) => {
    setSocials(socials.map(soc => {
      if (soc.id === id) {
        return { ...soc, [field]: value };
      }
      return soc;
    }));
  };

  // --------------------------------------------------------------------------
  // TABS CONFIG
  // --------------------------------------------------------------------------
  const tabs = [
    { id: "profile", label: "Perfil & Trajetória", icon: "fa-user-gear" },
    { id: "projects", label: "Projetos", icon: "fa-briefcase" },
    { id: "experience", label: "Empresas & Logos", icon: "fa-layer-group" },
    { id: "socials", label: "Conexões & Redes", icon: "fa-paper-plane" },
  ];

  // --------------------------------------------------------------------------
  // RENDER: UNINITIALIZED DATABASE PORTAL
  // --------------------------------------------------------------------------
  if (!isDbInitialized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 text-center select-none bg-background">
        <div className="relative max-w-[480px] w-full">
          {/* Glow */}
          <div className="absolute -inset-10 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <Card className="relative p-8 md:p-10 bg-card/80 backdrop-blur-xl border-border/40 shadow-2xl">
            <CardContent className="flex flex-col items-center p-0">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-6 transition-transform hover:scale-105 duration-300 bg-primary/10 border border-primary/25 text-primary">
                <i className="fa-solid fa-database"></i>
              </div>
              
              <h1 className="text-2xl font-black mb-3 tracking-tight text-foreground">
                Conexão Estabelecida!
              </h1>
              
              <p className="text-xs text-muted-foreground mb-8 leading-relaxed px-2">
                Sua aplicação Next.js foi integrada com sucesso ao <strong className="text-foreground">Vercel Postgres (Neon)</strong> e <strong className="text-foreground">Vercel Blob</strong>! 
                Agora vamos estruturar as tabelas e povoar o banco com as suas informações.
              </p>

              {dbMessage && (
                <div className="text-[11px] mb-6 text-primary font-semibold animate-pulse py-2.5 px-4 rounded-lg bg-primary/5 border border-primary/15 w-full">
                  <i className="fa-solid fa-spinner fa-spin mr-1.5"></i> {dbMessage}
                </div>
              )}

              <Button
                onClick={handleDbInitialize}
                disabled={dbLoading}
                className="w-full h-11 font-bold text-sm tracking-wide cursor-pointer"
              >
                {dbLoading ? (
                  <>Criando Tabelas...</>
                ) : (
                  <>Inicializar Banco de Dados <i className="fa-solid fa-bolt-lightning ml-1"></i></>
                )}
              </Button>
              
              <div className="mt-8 text-[10px] text-muted-foreground/40 font-medium flex items-center justify-center gap-3 uppercase tracking-wider select-none">
                <span>Next.js</span>
                <span>•</span>
                <span>Vercel Postgres</span>
                <span>•</span>
                <span>Vercel Blob</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: MAIN DASHBOARD
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground select-none">
      
      {/* ===================== TOAST ===================== */}
      {statusMsg.text && (
        <div className={cn(
          "fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-xs font-bold shadow-2xl border backdrop-blur-md",
          "animate-[slideIn_0.3s_ease-out]",
          statusMsg.type === "error" 
            ? "border-destructive/30 bg-destructive/10 text-destructive" 
            : "border-primary/30 bg-primary/10 text-primary"
        )}>
          <i className={cn("text-sm", statusMsg.type === "error" ? "fa-solid fa-circle-xmark" : "fa-solid fa-circle-check")} />
          {statusMsg.text}
        </div>
      )}

      {/* ===================== HEADER ===================== */}
      <header className="sticky top-0 z-40 w-full h-16 px-6 flex items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black tracking-tighter text-foreground">
            LV<span className="text-primary">.</span>
          </span>
          <Badge variant="outline" className="text-[10px] font-bold tracking-widest border-primary/25 bg-primary/5 text-primary uppercase">
            Admin Console
          </Badge>
        </div>
        
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" asChild className="h-9 text-xs font-semibold gap-1.5 cursor-pointer">
            <a href="/" target="_blank" rel="noopener noreferrer" className="no-underline">
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" /> Ver Site
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout} className="h-9 text-xs font-semibold gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 cursor-pointer">
            Sair <i className="fa-solid fa-right-from-bracket text-[10px]" />
          </Button>
        </div>
      </header>

      {/* ===================== BODY ===================== */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* =================== SIDEBAR =================== */}
        <aside className="w-full md:w-[260px] shrink-0 border-r border-border/60 bg-card/50 flex flex-col">
          <div className="p-5 flex flex-col gap-1.5 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 px-3 mb-3 select-none">
              Editor de Conteúdo
            </span>

            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== "projects") setEditingProject(null); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer text-left",
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                )}
              >
                <i className={cn("fa-solid w-4 text-center text-sm", tab.icon)} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sidebar footer */}
          <div className="p-5 border-t border-border/40">
            <div className="text-[10px] text-muted-foreground/40 font-medium flex items-center gap-2 select-none">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Conectado ao Neon
            </div>
          </div>
        </aside>

        {/* =================== CONTENT =================== */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-[820px] mx-auto flex flex-col gap-8">
          
          {/* =============== TAB: PROFILE =============== */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-8 animate-[fadeIn_0.25s_ease-out]">
              {/* Page title */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Perfil & Trajetória</h2>
                <p className="text-sm text-muted-foreground mt-1.5">Configure as informações da sua página inicial e os parágrafos da seção Sobre Mim.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-8">
                
                {/* Section: Apresentação */}
                <Card className="bg-card/60 border-border/40 shadow-lg shadow-black/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[11px] font-bold uppercase text-primary tracking-[0.15em] flex items-center gap-2">
                      <i className="fa-solid fa-id-card text-xs" /> Apresentação Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FieldGroup label="Nome de Exibição">
                        <Input 
                          type="text" required
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="h-10 bg-background/50"
                        />
                      </FieldGroup>
                      <FieldGroup label="Subtítulo (Tagline)">
                        <Input 
                          type="text" required
                          value={profile.subtitle}
                          onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })}
                          className="h-10 bg-background/50"
                        />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Descrição do Hero">
                      <Textarea 
                        rows={3} required
                        value={profile.description}
                        onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                        className="resize-none leading-relaxed bg-background/50"
                      />
                    </FieldGroup>
                  </CardContent>
                </Card>

                {/* Section: Biografia */}
                <Card className="bg-card/60 border-border/40 shadow-lg shadow-black/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[11px] font-bold uppercase text-primary tracking-[0.15em] flex items-center gap-2">
                      <i className="fa-solid fa-book-open text-xs" /> Sobre Mim (Biografia)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5 pt-2">
                    {["bio_p1", "bio_p2", "bio_p3"].map((field, i) => (
                      <FieldGroup key={field} label={`${i + 1}º Parágrafo`}>
                        <Textarea 
                          rows={3} required
                          value={profile[field]}
                          onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                          className="resize-none leading-relaxed bg-background/50"
                        />
                      </FieldGroup>
                    ))}
                  </CardContent>
                </Card>

                {/* Section: Documentos */}
                <Card className="bg-card/60 border-border/40 shadow-lg shadow-black/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[11px] font-bold uppercase text-primary tracking-[0.15em] flex items-center gap-2">
                      <i className="fa-solid fa-cloud-arrow-up text-xs" /> Anexos (Vercel Blob)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      <UploadCard
                        title="PDF de Currículo (CV)"
                        hasFile={!!profile.cv_url}
                        activeLabel="Currículo Ativo"
                        fileUrl={profile.cv_url}
                        uploading={uploadingField === "cv"}
                        onUpload={(e) => handleFileUpload(e, "cv")}
                        accept=".pdf"
                        hint="Selecione arquivos .pdf de até 5MB"
                      />
                      <UploadCard
                        title="PDF do Certificado Bubble"
                        hasFile={!!profile.certificate_bubble_url}
                        activeLabel="Certificado Ativo"
                        fileUrl={profile.certificate_bubble_url}
                        uploading={uploadingField === "certificate"}
                        onUpload={(e) => handleFileUpload(e, "certificate")}
                        accept=".pdf"
                        hint="Selecione arquivos .pdf de até 5MB"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" className="self-start h-10 px-6 gap-2 font-bold cursor-pointer">
                  <i className="fa-solid fa-check text-xs" /> Salvar Alterações
                </Button>
              </form>
            </div>
          )}

          {/* =============== TAB: PROJECTS =============== */}
          {activeTab === "projects" && (
            <div className="flex flex-col gap-8 animate-[fadeIn_0.25s_ease-out]">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Projetos</h2>
                  <p className="text-sm text-muted-foreground mt-1.5">Crie e edite os cards de projetos mostrados na grade de destaques.</p>
                </div>
                {!editingProject && (
                  <Button onClick={handleNewProjectClick} className="shrink-0 h-10 gap-2 font-bold cursor-pointer">
                    <i className="fa-solid fa-plus text-[10px]" /> Adicionar Projeto
                  </Button>
                )}
              </div>

              {/* Project Form */}
              {editingProject ? (
                <Card className="bg-card/60 border-border/40 shadow-lg shadow-black/5 animate-[fadeIn_0.25s_ease-out]">
                  <CardHeader className="pb-2 border-b border-border/40">
                    <CardTitle className="text-[11px] font-bold uppercase text-primary tracking-[0.15em] flex items-center gap-2">
                      <i className="fa-solid fa-pen-ruler text-xs" />
                      {editingProject.id ? `Editar: ${editingProject.title}` : "Novo Projeto"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProjectSubmit} className="flex flex-col gap-5 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FieldGroup label="Título do Projeto">
                          <Input type="text" required value={editingProject.title} className="h-10 bg-background/50"
                            onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })} />
                        </FieldGroup>
                        <FieldGroup label="Categoria / Escopo">
                          <Input type="text" required placeholder="ex: SaaS B2B / IA" value={editingProject.category} className="h-10 bg-background/50"
                            onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })} />
                        </FieldGroup>
                      </div>

                      <FieldGroup label="Descrição Detalhada">
                        <Textarea rows={4} required value={editingProject.description} className="resize-none leading-relaxed bg-background/50"
                          onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })} />
                      </FieldGroup>

                      <FieldGroup label="Badges de Tecnologia (Separados por vírgula)">
                        <Input type="text" required placeholder="ex: React, TypeScript, Supabase" className="h-10 bg-background/50"
                          value={Array.isArray(editingProject.tags) ? editingProject.tags.join(", ") : editingProject.tags}
                          onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value })} />
                      </FieldGroup>

                      <Separator className="my-1" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Link Principal */}
                        <div className="flex flex-col gap-4 p-5 rounded-xl bg-background/40 border border-border/40">
                          <span className="text-[11px] font-bold text-foreground tracking-wide flex items-center gap-1.5">
                            <i className="fa-solid fa-link text-primary text-[10px]" /> Ação Principal
                          </span>
                          <FieldGroup label="Texto do Botão">
                            <Input type="text" required value={editingProject.link_label} className="h-9 bg-background/50 text-xs"
                              onChange={(e) => setEditingProject({ ...editingProject, link_label: e.target.value })} />
                          </FieldGroup>
                          <FieldGroup label="Link URL / Destino">
                            <Input type="text" required value={editingProject.link_url} className="h-9 bg-background/50 text-xs"
                              onChange={(e) => setEditingProject({ ...editingProject, link_url: e.target.value })} />
                          </FieldGroup>
                        </div>

                        {/* Link Secundário */}
                        <div className="flex flex-col gap-4 p-5 rounded-xl bg-background/40 border border-border/40">
                          <span className="text-[11px] font-bold text-foreground tracking-wide flex items-center gap-1.5">
                            <i className="fa-solid fa-code-branch text-muted-foreground text-[10px]" /> Ação Secundária <span className="text-muted-foreground font-normal">(Opcional)</span>
                          </span>
                          <FieldGroup label="Texto do Botão">
                            <Input type="text" value={editingProject.secondary_link_label || ""} className="h-9 bg-background/50 text-xs"
                              onChange={(e) => setEditingProject({ ...editingProject, secondary_link_label: e.target.value })} />
                          </FieldGroup>
                          <FieldGroup label="Link URL / Destino">
                            <Input type="text" value={editingProject.secondary_link || ""} className="h-9 bg-background/50 text-xs"
                              onChange={(e) => setEditingProject({ ...editingProject, secondary_link: e.target.value })} />
                          </FieldGroup>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" className="h-10 gap-2 font-bold cursor-pointer">
                          <i className="fa-solid fa-check text-xs" /> Salvar Projeto
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditingProject(null)} className="h-10 cursor-pointer">
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                /* Project Grid */
                <div className="flex flex-col gap-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="bg-card/60 border-border/40 shadow-md shadow-black/5 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all duration-200 hover:border-border/70 hover:shadow-lg">
                      <div className="flex-1 min-w-0 pr-4">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider mb-2 text-primary bg-primary/10 border-primary/15">
                          {project.category}
                        </Badge>
                        <h4 className="text-base font-bold text-foreground">{project.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{project.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(Array.isArray(project.tags) ? project.tags : []).map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-medium bg-muted/50 text-muted-foreground">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Button variant="outline" size="sm" onClick={() => setEditingProject(project)} className="gap-1.5 h-9 cursor-pointer">
                          <i className="fa-solid fa-pen-to-square text-[11px] text-primary" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project.id)} className="gap-1.5 h-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 cursor-pointer">
                          <i className="fa-solid fa-trash text-[11px]" /> Excluir
                        </Button>
                      </div>
                    </Card>
                  ))}

                  {projects.length === 0 && (
                    <Card className="border-dashed border-border/40 bg-muted/5">
                      <CardContent className="text-center py-20">
                        <i className="fa-solid fa-folder-open text-2xl text-muted-foreground/30 mb-3 block" />
                        <p className="text-muted-foreground text-xs">Nenhum projeto cadastrado no banco.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =============== TAB: EXPERIENCE =============== */}
          {activeTab === "experience" && (
            <div className="flex flex-col gap-8 animate-[fadeIn_0.25s_ease-out]">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Experiência & Logos</h2>
                <p className="text-sm text-muted-foreground mt-1.5">Configure as empresas e os nomes textuais das marcas que ficam rolando no carrossel infinito.</p>
              </div>

              {/* Add Company Form */}
              <Card className="bg-card/60 border-border/40 shadow-lg shadow-black/5">
                <CardHeader className="pb-2 border-b border-border/40">
                  <CardTitle className="text-[11px] font-bold uppercase text-primary tracking-[0.15em] flex items-center gap-2">
                    <i className="fa-solid fa-building text-xs" /> Adicionar Empresa ao Carrossel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleExperienceSubmit} className="flex flex-col gap-5 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FieldGroup label="Nome da Empresa">
                        <Input type="text" required placeholder="ex: InfoEduc" className="h-10 bg-background/50"
                          value={newExp.company_name}
                          onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value, logo_text: e.target.value })} />
                      </FieldGroup>
                      <div className="flex flex-col gap-2">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Logo (Upload - Opcional)</Label>
                        <div className="flex items-center gap-3 mt-0.5">
                          <label className="relative px-4 py-2.5 border border-dashed border-border/60 hover:border-primary/40 rounded-lg bg-background/40 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 select-none">
                            <i className="fa-solid fa-image mr-1.5" /> Escolher Imagem
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "experience_logo")} className="hidden" />
                          </label>
                          {uploadingField === "experience_logo" && <i className="fa-solid fa-spinner fa-spin text-primary" />}
                          {newExp.logo_url && (
                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 select-none">
                              <i className="fa-solid fa-circle-check" /> Pronta!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button type="submit" className="self-start h-10 gap-2 font-bold cursor-pointer">
                      <i className="fa-solid fa-plus text-xs" /> Adicionar Empresa
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Company list */}
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-bold uppercase text-muted-foreground/60 tracking-[0.15em] select-none">
                  Empresas Cadastradas ({experiences.length})
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {experiences.map((exp) => (
                    <Card key={exp.id} className="bg-card/60 border-border/40 shadow-md shadow-black/5 p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:border-border/70">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-muted/50 border border-border/50 select-none overflow-hidden">
                          {exp.logo_url ? (
                            <img src={exp.logo_url} alt={exp.company_name} className="max-w-[70%] max-h-[70%] object-contain" />
                          ) : (
                            <span className="text-[10px] font-black text-primary">{exp.company_name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">{exp.company_name}</h4>
                          <p className="text-[10px] text-muted-foreground truncate">{exp.logo_url ? "Imagem ativa" : `Fallback: ${exp.logo_text}`}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteExperience(exp.id)} className="shrink-0 h-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 cursor-pointer">
                        <i className="fa-solid fa-trash text-[10px]" />
                      </Button>
                    </Card>
                  ))}
                </div>

                {experiences.length === 0 && (
                  <Card className="border-dashed border-border/40 bg-muted/5">
                    <CardContent className="text-center py-20">
                      <i className="fa-solid fa-building text-2xl text-muted-foreground/30 mb-3 block" />
                      <p className="text-muted-foreground text-xs">Nenhuma empresa adicionada ao carrossel.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* =============== TAB: SOCIALS =============== */}
          {activeTab === "socials" && (
            <div className="flex flex-col gap-8 animate-[fadeIn_0.25s_ease-out]">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Conexões & Redes</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Gerencie quais redes de contato estão ativas e configure seus respectivos links diretos.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {socials.map((social) => (
                  <form key={social.id} onSubmit={(e) => handleSocialSubmit(e, social)}>
                    <Card className="bg-card/60 border-border/40 shadow-md shadow-black/5 p-5 transition-all duration-200 hover:border-border/70">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        {/* Platform info */}
                        <div className="flex items-center gap-3.5 min-w-[180px] shrink-0">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 bg-muted/50 border border-border/50 select-none"
                            style={{ color: social.brandColor }}
                          >
                            <i className={social.icon} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{social.platform}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{social.subtitle}</p>
                          </div>
                        </div>

                        {/* Input + Toggle */}
                        <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
                              {social.platform === "WhatsApp" && "Número (DDD + Número)"}
                              {social.platform === "E-mail" && "E-mail Oficial"}
                              {social.platform === "GitHub" && "Username do GitHub"}
                              {social.platform === "LinkedIn" && "Username do LinkedIn"}
                              {social.platform === "Instagram" && "Username do Instagram (sem @)"}
                            </Label>
                            <Input 
                              type="text" required
                              value={social.param_value}
                              onChange={(e) => handleSocialChange(social.id, "param_value", e.target.value)}
                              className="h-10 bg-background/50"
                            />
                          </div>

                          <div className="flex items-center gap-2.5 self-end md:self-center pb-0.5 md:pb-0">
                            <Switch
                              id={`visible-${social.id}`}
                              checked={social.is_visible}
                              onCheckedChange={(checked) => handleSocialChange(social.id, "is_visible", checked)}
                            />
                            <Label htmlFor={`visible-${social.id}`} className="text-xs cursor-pointer font-semibold select-none">
                              Visível
                            </Label>
                          </div>
                        </div>

                        <Button type="submit" size="sm" className="self-end md:self-center h-9 px-5 font-bold cursor-pointer">
                          Salvar
                        </Button>
                      </div>
                    </Card>
                  </form>
                ))}
              </div>
            </div>
          )}

          </div>
        </main>
      </div>
    </div>
  );
}


// ==========================================================================
// HELPER COMPONENTS (internal, not exported)
// ==========================================================================

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

function UploadCard({ title, hasFile, activeLabel, fileUrl, uploading, onUpload, accept, hint }: {
  title: string;
  hasFile: boolean;
  activeLabel: string;
  fileUrl: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl bg-background/40 border border-border/40">
      <span className="text-[12px] font-bold text-foreground tracking-wide">{title}</span>
      
      {hasFile ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 select-none">
            <i className="fa-solid fa-circle-check" /> {activeLabel}
          </span>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" 
            className="text-xs text-muted-foreground hover:text-foreground underline font-semibold transition duration-200">
            Visualizar PDF
          </a>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground/60 italic px-1 select-none">Nenhum arquivo enviado ainda</div>
      )}

      <label className="relative flex flex-col items-center justify-center p-6 border border-dashed border-border/50 hover:border-primary/40 rounded-xl bg-muted/10 cursor-pointer transition-all duration-200 group">
        <i className="fa-solid fa-cloud-arrow-up text-xl text-muted-foreground/40 group-hover:text-primary mb-2 transition-colors" />
        <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Fazer Upload de Novo PDF</span>
        <span className="text-[10px] text-muted-foreground/40 mt-1 select-none">{hint}</span>
        <input type="file" accept={accept} onChange={onUpload} className="hidden" />
      </label>
      
      {uploading && (
        <div className="flex items-center gap-2 text-xs text-primary font-semibold animate-pulse select-none">
          <i className="fa-solid fa-spinner fa-spin" /> Enviando para o Vercel Blob...
        </div>
      )}
    </div>
  );
}
