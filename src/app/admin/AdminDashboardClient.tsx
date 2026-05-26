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
  // RENDER: UNINITIALIZED DATABASE PORTAL
  // --------------------------------------------------------------------------
  if (!isDbInitialized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 text-center select-none bg-background">
        <Card className="max-w-[480px] w-full p-8 md:p-10 relative overflow-hidden bg-card/65 backdrop-blur-xl border-border/30">
          <CardContent className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-[20px] mx-auto flex items-center justify-center text-2xl mb-6 transition-transform hover:scale-105 duration-300 bg-primary/10 border border-primary/25 text-primary shadow-[0_10px_25px_-8px_hsl(var(--primary)/0.4)]">
              <i className="fa-solid fa-database"></i>
            </div>
            
            <h1 className="text-2xl font-black mb-3 tracking-tight text-foreground">
              Conexão Estabelecida!
            </h1>
            
            <p className="text-xs font-light text-muted-foreground mb-8 leading-relaxed px-2">
              Sua aplicação Next.js foi integrada com sucesso ao <strong>Vercel Postgres (Neon)</strong> e <strong>Vercel Blob</strong>! 
              Agora vamos estruturar as tabelas e povoar o banco com as suas informações.
            </p>

            {dbMessage && (
              <div className="text-[11px] mb-6 text-primary font-semibold animate-pulse py-2 px-4 rounded-lg bg-primary/5 border border-primary/10 w-full">
                <i className="fa-solid fa-spinner fa-spin mr-1.5"></i> {dbMessage}
              </div>
            )}

            <Button
              onClick={handleDbInitialize}
              disabled={dbLoading}
              className="w-full h-11 font-bold text-sm tracking-wide"
            >
              {dbLoading ? (
                <>Criando Tabelas...</>
              ) : (
                <>Inicializar Banco de Dados <i className="fa-solid fa-bolt-lightning ml-0.5"></i></>
              )}
            </Button>
            
            <div className="mt-8 text-[10px] text-muted-foreground/50 font-medium flex items-center justify-center gap-3 uppercase tracking-wider">
              <span>Next.js</span>
              <span>•</span>
              <span>Vercel Postgres</span>
              <span>•</span>
              <span>Vercel Blob</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: SECURE EDITOR PORTAL
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
      {/* Toast Alert */}
      {statusMsg.text && (
        <Card className={cn(
          "fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 text-xs font-bold shadow-2xl animate-[fadeIn_0.2s_ease-out] border-2",
          statusMsg.type === "error" 
            ? "border-destructive bg-destructive/10 text-destructive" 
            : "border-primary bg-primary/10 text-primary"
        )}>
          <i className={statusMsg.type === "error" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-check"}></i>
          {statusMsg.text}
        </Card>
      )}

      {/* Main Admin Navbar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-foreground select-none">
            LV<span className="text-primary">.</span>
          </span>
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider border-primary/20 bg-primary/8 text-primary">
            Admin Console
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <a href="/" className="flex items-center gap-1.5 no-underline">
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Ver Site
            </a>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-1.5">
            Sair <i className="fa-solid fa-right-from-bracket text-[10px]"></i>
          </Button>
        </div>
      </header>

      {/* Dashboard Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Side Tab Navigation Menu */}
        <aside className="w-full md:w-[240px] p-6 border-r border-border flex flex-col gap-2 shrink-0 bg-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2 block select-none">
            Editor de Conteúdo
          </span>

          <Button
            variant={activeTab === "profile" ? "secondary" : "ghost"}
            onClick={() => { setActiveTab("profile"); setEditingProject(null); }}
            className={cn(
              "w-full justify-start gap-3 text-xs font-semibold",
              activeTab === "profile" 
                ? "border border-primary/20 bg-primary/10 text-primary" 
                : "text-muted-foreground"
            )}
          >
            <i className="fa-solid fa-user-gear text-sm"></i> Perfil & Trajetória
          </Button>

          <Button
            variant={activeTab === "projects" ? "secondary" : "ghost"}
            onClick={() => { setActiveTab("projects"); }}
            className={cn(
              "w-full justify-start gap-3 text-xs font-semibold",
              activeTab === "projects" 
                ? "border border-primary/20 bg-primary/10 text-primary" 
                : "text-muted-foreground"
            )}
          >
            <i className="fa-solid fa-briefcase text-sm"></i> Projetos
          </Button>

          <Button
            variant={activeTab === "experience" ? "secondary" : "ghost"}
            onClick={() => { setActiveTab("experience"); setEditingProject(null); }}
            className={cn(
              "w-full justify-start gap-3 text-xs font-semibold",
              activeTab === "experience" 
                ? "border border-primary/20 bg-primary/10 text-primary" 
                : "text-muted-foreground"
            )}
          >
            <i className="fa-solid fa-layer-group text-sm"></i> Empresas & Logos
          </Button>

          <Button
            variant={activeTab === "socials" ? "secondary" : "ghost"}
            onClick={() => { setActiveTab("socials"); setEditingProject(null); }}
            className={cn(
              "w-full justify-start gap-3 text-xs font-semibold",
              activeTab === "socials" 
                ? "border border-primary/20 bg-primary/10 text-primary" 
                : "text-muted-foreground"
            )}
          >
            <i className="fa-solid fa-paper-plane text-sm"></i> Conexões & Redes
          </Button>
        </aside>

        {/* Right Side Content Panel */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-[850px] w-full flex flex-col gap-8">
          
          {/* TAB: PROFILE (Hero & Sobre) */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
              <div className="mb-2">
                <h2 className="text-2xl font-bold tracking-tight">Perfil & Trajetória</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure as informações da sua página inicial e os parágrafos da seção Sobre Mim.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
                
                {/* Módulo: Apresentação Principal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase text-primary tracking-wider">Apresentação Principal</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nome de Exibição</Label>
                        <Input 
                          type="text" 
                          required
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Subtítulo (Tagline)</Label>
                        <Input 
                          type="text" 
                          required
                          value={profile.subtitle}
                          onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Descrição do Hero</Label>
                      <Textarea 
                        rows={3}
                        required
                        value={profile.description}
                        onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                        className="resize-none leading-relaxed"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Módulo: Trajetória */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase text-primary tracking-wider">Sobre Mim (Biografia)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Primeiro Parágrafo</Label>
                      <Textarea 
                        rows={3}
                        required
                        value={profile.bio_p1}
                        onChange={(e) => setProfile({ ...profile, bio_p1: e.target.value })}
                        className="resize-none leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Segundo Parágrafo</Label>
                      <Textarea 
                        rows={3}
                        required
                        value={profile.bio_p2}
                        onChange={(e) => setProfile({ ...profile, bio_p2: e.target.value })}
                        className="resize-none leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Terceiro Parágrafo</Label>
                      <Textarea 
                        rows={3}
                        required
                        value={profile.bio_p3}
                        onChange={(e) => setProfile({ ...profile, bio_p3: e.target.value })}
                        className="resize-none leading-relaxed"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Módulo: Documentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase text-primary tracking-wider">Anexos (Vercel Blob)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* CV PDF Upload */}
                      <div className="flex flex-col gap-3 p-5 rounded-xl bg-muted/30 border border-border">
                        <span className="text-[12px] font-bold text-foreground tracking-wide">PDF de Currículo (CV)</span>
                        
                        {profile.cv_url ? (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-1">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 select-none">
                              <i className="fa-solid fa-circle-check"></i> Currículo Ativo
                            </span>
                            <a 
                              href={profile.cv_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-muted-foreground hover:text-foreground underline font-semibold transition duration-200"
                            >
                              Visualizar PDF
                            </a>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic mb-1 px-1 select-none">Nenhum arquivo enviado ainda</div>
                        )}

                        <label className="relative flex flex-col items-center justify-center p-5 border border-dashed border-muted hover:border-primary/40 rounded-xl bg-muted/20 cursor-pointer transition-all duration-200 group">
                          <i className="fa-solid fa-cloud-arrow-up text-xl text-muted-foreground group-hover:text-primary mb-2 transition-colors"></i>
                          <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Fazer Upload de Novo PDF</span>
                          <span className="text-[10px] text-muted-foreground/60 mt-1 select-none">Selecione arquivos .pdf de até 5MB</span>
                          <input 
                            type="file" 
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(e, "cv")}
                            className="hidden"
                          />
                        </label>
                        
                        {uploadingField === "cv" && (
                          <div className="flex items-center gap-2 text-xs text-primary font-semibold animate-pulse select-none mt-1">
                            <i className="fa-solid fa-spinner fa-spin"></i> Enviando para o Vercel Blob...
                          </div>
                        )}
                      </div>

                      {/* Bubble Certificate PDF Upload */}
                      <div className="flex flex-col gap-3 p-5 rounded-xl bg-muted/30 border border-border">
                        <span className="text-[12px] font-bold text-foreground tracking-wide">PDF do Certificado Bubble</span>
                        
                        {profile.certificate_bubble_url ? (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-1">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 select-none">
                              <i className="fa-solid fa-circle-check"></i> Certificado Ativo
                            </span>
                            <a 
                              href={profile.certificate_bubble_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-muted-foreground hover:text-foreground underline font-semibold transition duration-200"
                            >
                              Visualizar PDF
                            </a>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic mb-1 px-1 select-none">Nenhum arquivo enviado ainda</div>
                        )}

                        <label className="relative flex flex-col items-center justify-center p-5 border border-dashed border-muted hover:border-primary/40 rounded-xl bg-muted/20 cursor-pointer transition-all duration-200 group">
                          <i className="fa-solid fa-cloud-arrow-up text-xl text-muted-foreground group-hover:text-primary mb-2 transition-colors"></i>
                          <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Fazer Upload de Novo PDF</span>
                          <span className="text-[10px] text-muted-foreground/60 mt-1 select-none">Selecione arquivos .pdf de até 5MB</span>
                          <input 
                            type="file" 
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(e, "certificate")}
                            className="hidden"
                          />
                        </label>

                        {uploadingField === "certificate" && (
                          <div className="flex items-center gap-2 text-xs text-primary font-semibold animate-pulse select-none mt-1">
                            <i className="fa-solid fa-spinner fa-spin"></i> Enviando para o Vercel Blob...
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" className="self-start gap-2">
                  Salvar Alterações <i className="fa-solid fa-check text-xs"></i>
                </Button>
              </form>
            </div>
          )}

          {/* TAB: PROJECTS (CRUD) */}
          {activeTab === "projects" && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Projetos</h2>
                  <p className="text-sm text-muted-foreground mt-1">Crie e edite os cards de projetos mostrados na grade de destaques.</p>
                </div>
                {!editingProject && (
                  <Button onClick={handleNewProjectClick} className="shrink-0 gap-2">
                    <i className="fa-solid fa-plus text-[10px]"></i> Adicionar Projeto
                  </Button>
                )}
              </div>

              {/* Form de Adicionar/Editar Projeto */}
              {editingProject ? (
                <Card className="animate-[fadeIn_0.2s_ease-out]">
                  <CardHeader className="border-b">
                    <CardTitle className="text-xs font-bold uppercase text-primary tracking-wider">
                      {editingProject.id ? `Editar: ${editingProject.title}` : "Novo Projeto"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProjectSubmit} className="flex flex-col gap-5 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Título do Projeto</Label>
                          <Input 
                            type="text" required
                            value={editingProject.title}
                            onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Categoria / Escopo</Label>
                          <Input 
                            type="text" required placeholder="ex: SaaS B2B / IA"
                            value={editingProject.category}
                            onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Descrição Detalhada</Label>
                        <Textarea 
                          rows={4} required
                          value={editingProject.description}
                          onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                          className="resize-none leading-relaxed"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Badges de Tecnologia (Separados por vírgula)</Label>
                        <Input 
                          type="text" required placeholder="ex: React, TypeScript, Supabase"
                          value={Array.isArray(editingProject.tags) ? editingProject.tags.join(", ") : editingProject.tags}
                          onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value })}
                        />
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Link de Ação Principal */}
                        <div className="flex flex-col gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                          <span className="text-[12px] font-bold text-foreground border-b border-border pb-1.5 block tracking-wide">Ação Principal</span>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] uppercase tracking-wide">Texto do Botão (ex: Conhecer o SaaS)</Label>
                            <Input 
                              type="text" required
                              value={editingProject.link_label}
                              onChange={(e) => setEditingProject({ ...editingProject, link_label: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] uppercase tracking-wide">Link URL / Destino</Label>
                            <Input 
                              type="text" required
                              value={editingProject.link_url}
                              onChange={(e) => setEditingProject({ ...editingProject, link_url: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Link de Ação Secundário */}
                        <div className="flex flex-col gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                          <span className="text-[12px] font-bold text-foreground border-b border-border pb-1.5 block tracking-wide">Ação Secundária (Opcional)</span>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] uppercase tracking-wide">Texto do Botão (ex: Figma / Código)</Label>
                            <Input 
                              type="text"
                              value={editingProject.secondary_link_label || ""}
                              onChange={(e) => setEditingProject({ ...editingProject, secondary_link_label: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] uppercase tracking-wide">Link URL / Destino</Label>
                            <Input 
                              type="text"
                              value={editingProject.secondary_link || ""}
                              onChange={(e) => setEditingProject({ ...editingProject, secondary_link: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <Button type="submit" className="gap-2">
                          Salvar Projeto <i className="fa-solid fa-check text-xs"></i>
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setEditingProject(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                /* Grade de Projetos */
                <div className="flex flex-col gap-4">
                  {projects.map((project) => (
                    <Card 
                      key={project.id} 
                      className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all duration-200 hover:bg-muted/30"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider mb-1.5 text-primary bg-primary/10">
                          {project.category}
                        </Badge>
                        <h4 className="text-base font-bold text-foreground">{project.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 leading-relaxed">{project.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(Array.isArray(project.tags) ? project.tags : []).map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-medium">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProject(project)}
                          className="gap-1.5"
                        >
                          <i className="fa-solid fa-pen-to-square text-[11px] text-primary"></i> Editar
                        </Button>
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="gap-1.5"
                        >
                          <i className="fa-solid fa-trash text-[11px]"></i> Excluir
                        </Button>
                      </div>
                    </Card>
                  ))}

                  {projects.length === 0 && (
                    <Card className="border-dashed border-muted bg-muted/5">
                      <CardContent className="text-center py-16">
                        <p className="text-muted-foreground text-xs italic">
                          Nenhum projeto cadastrado no banco.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: EXPERIENCE & LOGOS */}
          {activeTab === "experience" && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Experiência & Logos</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure as empresas e os nomes textuais das marcas que ficam rolando no carrossel infinito.</p>
              </div>

              {/* Form de Adicionar Empresa */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-xs font-bold uppercase text-primary tracking-wider">Adicionar Empresa ao Carrossel</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleExperienceSubmit} className="flex flex-col gap-5 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nome da Empresa</Label>
                        <Input 
                          type="text" required placeholder="ex: InfoEduc"
                          value={newExp.company_name}
                          onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value, logo_text: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Logo (Upload de Imagem - Opcional)</Label>
                        <div className="flex items-center gap-3">
                          <label className="relative px-3.5 py-2.5 border border-dashed border-muted hover:border-primary/40 rounded-xl bg-muted/20 cursor-pointer text-xs font-bold text-muted-foreground transition duration-200 select-none">
                            <i className="fa-solid fa-image mr-1"></i> Escolher Imagem
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "experience_logo")}
                              className="hidden"
                            />
                          </label>
                          {uploadingField === "experience_logo" && <i className="fa-solid fa-spinner fa-spin text-primary"></i>}
                          {newExp.logo_url && <span className="text-xs text-emerald-400 font-bold max-w-[200px] truncate select-none"><i className="fa-solid fa-circle-check"></i> Pronta!</span>}
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="self-start gap-2">
                      Adicionar Empresa <i className="fa-solid fa-plus text-xs"></i>
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Empresas Cadastradas */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 border-b border-border pb-2">
                  Empresas Cadastradas ({experiences.length})
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {experiences.map((exp) => (
                    <Card 
                      key={exp.id} 
                      className="p-4 flex items-center justify-between gap-4 transition duration-200 hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-muted border border-border select-none">
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

                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="shrink-0"
                      >
                        Remover
                      </Button>
                    </Card>
                  ))}
                </div>

                {experiences.length === 0 && (
                  <Card className="border-dashed border-muted bg-muted/5">
                    <CardContent className="text-center py-16">
                      <p className="text-muted-foreground text-xs italic">
                        Nenhuma empresa adicionada ao carrossel.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* TAB: CONNECTIONS (SOCIAL NETWORKS) */}
          {activeTab === "socials" && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Conexões & Redes</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie quais redes de contato estão ativas e configure seus respectivos links diretos de forma simples.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {socials.map((social) => (
                  <form 
                    key={social.id} 
                    onSubmit={(e) => handleSocialSubmit(e, social)} 
                  >
                    <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-200 hover:bg-muted/20">
                      <div className="flex items-center gap-3.5 min-w-[200px]">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 bg-muted border border-border select-none"
                          style={{ color: social.brandColor }}
                        >
                          <i className={social.icon}></i>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{social.platform}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{social.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-5">
                        {/* Param input */}
                        <div className="flex-1 flex flex-col gap-1.5">
                          <Label className="text-[10px] uppercase tracking-wider">
                            {social.platform === "WhatsApp" && "Número (DDD + Número, ex: +5512997741275)"}
                            {social.platform === "E-mail" && "E-mail Oficial"}
                            {social.platform === "GitHub" && "Username do GitHub"}
                            {social.platform === "LinkedIn" && "Username do LinkedIn"}
                            {social.platform === "Instagram" && "Username do Instagram (sem @)"}
                          </Label>
                          <Input 
                            type="text" required
                            value={social.param_value}
                            onChange={(e) => handleSocialChange(social.id, "param_value", e.target.value)}
                          />
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-2 self-end md:self-center pb-1 md:pb-0">
                          <Switch
                            id={`visible-${social.id}`}
                            checked={social.is_visible}
                            onCheckedChange={(checked) => handleSocialChange(social.id, "is_visible", checked)}
                          />
                          <Label htmlFor={`visible-${social.id}`} className="text-xs cursor-pointer font-bold select-none">
                            Visível
                          </Label>
                        </div>
                      </div>

                      <Button type="submit" size="sm" className="self-end md:self-center">
                        Salvar
                      </Button>
                    </Card>
                  </form>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
