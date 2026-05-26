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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [dbLoading, setDbLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState("");
  const [profile, setProfile] = useState(initialProfile || {
    name: "", subtitle: "", description: "", bio_p1: "", bio_p2: "", bio_p3: "", cv_url: "", certificate_bubble_url: ""
  });
  const [projects, setProjects] = useState<any[]>(initialProjects || []);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [experiences, setExperiences] = useState<any[]>(initialExperience || []);
  const [newExp, setNewExp] = useState({ company_name: "", logo_text: "", logo_url: "" });
  const [socials, setSocials] = useState<any[]>(initialSocials || []);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
  };

  const handleLogout = async () => { await logoutAction(); window.location.href = "/admin/login"; };

  const handleDbInitialize = async () => {
    setDbLoading(true);
    setDbMessage("Estruturando tabelas e semeando dados de portfólio...");
    try {
      const res = await triggerDbInit();
      if (res.success) { setDbMessage(res.message); setTimeout(() => window.location.reload(), 1500); }
      else { setDbMessage("Erro: " + res.message); setDbLoading(false); }
    } catch (err: any) { setDbMessage("Erro: " + err.message); setDbLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await uploadFileAction(formData);
      if (res.success && res.url) {
        if (field === "cv") { setProfile({ ...profile, cv_url: res.url }); showStatus("Currículo enviado!"); }
        else if (field === "certificate") { setProfile({ ...profile, certificate_bubble_url: res.url }); showStatus("Certificado enviado!"); }
        else if (field === "experience_logo") { setNewExp({ ...newExp, logo_url: res.url }); showStatus("Logo enviada!"); }
        else if (field.startsWith("project_")) { setEditingProject({ ...editingProject, link_url: res.url }); showStatus("Arquivo enviado!"); }
      } else { showStatus(res.error || "Falha no upload.", "error"); }
    } catch { showStatus("Erro de conexão.", "error"); }
    finally { setUploadingField(null); }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const res = await updateProfile(profile); if (res.success) showStatus("Perfil atualizado!"); }
    catch (err: any) { showStatus(err.message || "Erro.", "error"); }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await saveProject({ ...editingProject, tags: typeof editingProject.tags === "string" ? editingProject.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : editingProject.tags });
      if (res.success) {
        showStatus(`Projeto "${editingProject.title}" salvo!`);
        const updated = [...projects];
        const idx = projects.findIndex(p => p.id === editingProject.id);
        if (idx !== -1) updated[idx] = editingProject; else updated.push({ ...editingProject, id: `proj_${Date.now()}` });
        setProjects(updated); setEditingProject(null); window.location.reload();
      }
    } catch (err: any) { showStatus(err.message || "Erro.", "error"); }
  };

  const handleNewProjectClick = () => {
    setEditingProject({ category: "", title: "", description: "", tags: "", link_url: "", link_label: "", secondary_link: "", secondary_link_label: "", order_index: projects.length });
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Excluir este projeto?")) return;
    try { const res = await deleteProject(id); if (res.success) { setProjects(projects.filter(p => p.id !== id)); showStatus("Excluído!"); } }
    catch (err: any) { showStatus(err.message || "Erro.", "error"); }
  };

  const handleExperienceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.company_name) return;
    try {
      const res = await addExperience(newExp);
      if (res.success) { showStatus("Empresa adicionada!"); setExperiences([...experiences, { ...newExp, id: `exp_${Date.now()}` }]); setNewExp({ company_name: "", logo_text: "", logo_url: "" }); window.location.reload(); }
    } catch (err: any) { showStatus(err.message || "Erro.", "error"); }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Remover esta empresa?")) return;
    try { const res = await deleteExperience(id); if (res.success) { setExperiences(experiences.filter(exp => exp.id !== id)); showStatus("Removida!"); } }
    catch (err: any) { showStatus(err.message || "Erro.", "error"); }
  };

  const handleSocialSubmit = async (e: React.FormEvent, social: any) => {
    e.preventDefault();
    try { const res = await updateSocialLink({ id: social.id, param_value: social.param_value, is_visible: social.is_visible }); if (res.success) showStatus(`${social.platform} atualizado!`); }
    catch (err: any) { showStatus(err.message || "Erro.", "error"); }
  };

  const handleSocialChange = (id: string, field: string, value: any) => {
    setSocials(socials.map(soc => soc.id === id ? { ...soc, [field]: value } : soc));
  };

  // ---- NAV TABS ----
  const tabs = [
    { id: "profile", label: "Perfil & Trajetória", icon: "fa-user-gear" },
    { id: "projects", label: "Projetos", icon: "fa-briefcase" },
    { id: "experience", label: "Empresas & Logos", icon: "fa-layer-group" },
    { id: "socials", label: "Conexões & Redes", icon: "fa-paper-plane" },
  ];

  // ---- DB INIT SCREEN ----
  if (!isDbInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Conexão Estabelecida!</CardTitle>
            <CardDescription>
              Sua aplicação foi integrada ao Vercel Postgres e Vercel Blob.
              Vamos estruturar as tabelas e popular o banco.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {dbMessage && (
              <p className="text-sm text-muted-foreground animate-pulse">{dbMessage}</p>
            )}
            <Button onClick={handleDbInitialize} disabled={dbLoading} className="w-full cursor-pointer">
              {dbLoading ? "Criando Tabelas..." : "Inicializar Banco de Dados"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- MAIN DASHBOARD ----
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* TOAST */}
      {statusMsg.text && (
        <div className={cn(
          "fixed top-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg",
          statusMsg.type === "error"
            ? "border-destructive/50 bg-destructive/10 text-destructive"
            : "border-border bg-card text-foreground"
        )}>
          {statusMsg.text}
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight">LV.</span>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm text-muted-foreground">Admin Console</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="/" target="_blank" className="no-underline">Ver Site</a>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground cursor-pointer">
            Sair
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-56 flex-col border-r border-border bg-background p-4 gap-1">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground">Menu</p>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== "projects") setEditingProject(null); }}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer text-left w-full",
                activeTab === tab.id
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <i className={cn("fa-solid w-4 text-center", tab.icon)} />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-3xl space-y-8">

            {/* ======== PROFILE TAB ======== */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Perfil & Trajetória</h2>
                  <p className="text-sm text-muted-foreground">Configure as informações da página inicial e da seção Sobre Mim.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Apresentação */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Apresentação Principal</CardTitle>
                      <CardDescription>Nome, subtítulo e descrição visíveis no hero da página.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome de Exibição</Label>
                          <Input id="name" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subtitle">Subtítulo (Tagline)</Label>
                          <Input id="subtitle" required value={profile.subtitle} onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="desc">Descrição do Hero</Label>
                        <Textarea id="desc" rows={3} required value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Biografia */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sobre Mim (Biografia)</CardTitle>
                      <CardDescription>Três parágrafos exibidos na seção &quot;Sobre&quot;.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(["bio_p1", "bio_p2", "bio_p3"] as const).map((field, i) => (
                        <div key={field} className="space-y-2">
                          <Label>{`${i + 1}º Parágrafo`}</Label>
                          <Textarea rows={3} required value={profile[field]} onChange={(e) => setProfile({ ...profile, [field]: e.target.value })} />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Uploads */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Anexos</CardTitle>
                      <CardDescription>PDFs armazenados no Vercel Blob.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <UploadBlock
                          title="Currículo (CV)"
                          hasFile={!!profile.cv_url}
                          fileUrl={profile.cv_url}
                          uploading={uploadingField === "cv"}
                          onUpload={(e) => handleFileUpload(e, "cv")}
                        />
                        <UploadBlock
                          title="Certificado Bubble"
                          hasFile={!!profile.certificate_bubble_url}
                          fileUrl={profile.certificate_bubble_url}
                          uploading={uploadingField === "certificate"}
                          onUpload={(e) => handleFileUpload(e, "certificate")}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" className="cursor-pointer">Salvar Alterações</Button>
                </form>
              </div>
            )}

            {/* ======== PROJECTS TAB ======== */}
            {activeTab === "projects" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Projetos</h2>
                    <p className="text-sm text-muted-foreground">Gerencie os cards de projetos da grade de destaques.</p>
                  </div>
                  {!editingProject && (
                    <Button onClick={handleNewProjectClick} className="cursor-pointer">+ Adicionar</Button>
                  )}
                </div>

                {editingProject ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{editingProject.id ? `Editar: ${editingProject.title}` : "Novo Projeto"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleProjectSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Título</Label>
                            <Input required value={editingProject.title} onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Input required placeholder="ex: SaaS B2B" value={editingProject.category} onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Textarea rows={3} required value={editingProject.description} onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Tecnologias (separadas por vírgula)</Label>
                          <Input required placeholder="React, TypeScript, Supabase" value={Array.isArray(editingProject.tags) ? editingProject.tags.join(", ") : editingProject.tags} onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value })} />
                        </div>

                        <Separator />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-3 rounded-lg border border-border p-4">
                            <p className="text-sm font-medium">Link Principal</p>
                            <div className="space-y-2"><Label className="text-xs">Texto do Botão</Label><Input required value={editingProject.link_label} onChange={(e) => setEditingProject({ ...editingProject, link_label: e.target.value })} /></div>
                            <div className="space-y-2"><Label className="text-xs">URL</Label><Input required value={editingProject.link_url} onChange={(e) => setEditingProject({ ...editingProject, link_url: e.target.value })} /></div>
                          </div>
                          <div className="space-y-3 rounded-lg border border-border p-4">
                            <p className="text-sm font-medium text-muted-foreground">Link Secundário (opcional)</p>
                            <div className="space-y-2"><Label className="text-xs">Texto do Botão</Label><Input value={editingProject.secondary_link_label || ""} onChange={(e) => setEditingProject({ ...editingProject, secondary_link_label: e.target.value })} /></div>
                            <div className="space-y-2"><Label className="text-xs">URL</Label><Input value={editingProject.secondary_link || ""} onChange={(e) => setEditingProject({ ...editingProject, secondary_link: e.target.value })} /></div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button type="submit" className="cursor-pointer">Salvar Projeto</Button>
                          <Button type="button" variant="outline" onClick={() => setEditingProject(null)} className="cursor-pointer">Cancelar</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <Card key={project.id} className="p-0">
                        <div className="flex items-center justify-between p-6">
                          <div className="space-y-1.5 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{project.category}</Badge>
                            </div>
                            <h4 className="font-semibold">{project.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {(Array.isArray(project.tags) ? project.tags : []).map((tag: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs font-normal">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => setEditingProject(project)} className="cursor-pointer">Editar</Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project.id)} className="text-destructive hover:text-destructive cursor-pointer">Excluir</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {projects.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                        Nenhum projeto cadastrado.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ======== EXPERIENCE TAB ======== */}
            {activeTab === "experience" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Experiência & Logos</h2>
                  <p className="text-sm text-muted-foreground">Empresas exibidas no carrossel infinito.</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Adicionar Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleExperienceSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nome da Empresa</Label>
                          <Input required placeholder="ex: InfoEduc" value={newExp.company_name} onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value, logo_text: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Logo (opcional)</Label>
                          <div className="flex items-center gap-3 pt-1">
                            <Button variant="outline" size="sm" asChild className="cursor-pointer">
                              <label>
                                Escolher Imagem
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "experience_logo")} className="hidden" />
                              </label>
                            </Button>
                            {uploadingField === "experience_logo" && <span className="text-xs text-muted-foreground animate-pulse">Enviando...</span>}
                            {newExp.logo_url && <span className="text-xs text-muted-foreground">✓ Pronta</span>}
                          </div>
                        </div>
                      </div>
                      <Button type="submit" className="cursor-pointer">Adicionar</Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Cadastradas ({experiences.length})</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {experiences.map((exp) => (
                      <Card key={exp.id} className="p-0">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-xs font-bold shrink-0">
                              {exp.logo_url ? (
                                <img src={exp.logo_url} alt={exp.company_name} className="max-w-[70%] max-h-[70%] object-contain" />
                              ) : (
                                exp.company_name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{exp.company_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{exp.logo_url ? "Imagem ativa" : "Texto"}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteExperience(exp.id)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                            Remover
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {experiences.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                      Nenhuma empresa adicionada.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======== SOCIALS TAB ======== */}
            {activeTab === "socials" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Conexões & Redes</h2>
                  <p className="text-sm text-muted-foreground">Configure os links e a visibilidade das suas redes.</p>
                </div>

                <div className="space-y-3">
                  {socials.map((social) => (
                    <Card key={social.id} className="p-0">
                      <form onSubmit={(e) => handleSocialSubmit(e, social)}>
                        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
                          {/* Platform */}
                          <div className="flex items-center gap-3 sm:w-44 shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary shrink-0" style={{ color: social.brandColor }}>
                              <i className={social.icon} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{social.platform}</p>
                              <p className="text-xs text-muted-foreground">{social.subtitle}</p>
                            </div>
                          </div>

                          {/* Input */}
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              {social.platform === "WhatsApp" && "Número (com DDD)"}
                              {social.platform === "E-mail" && "E-mail"}
                              {social.platform === "GitHub" && "Username"}
                              {social.platform === "LinkedIn" && "Username"}
                              {social.platform === "Instagram" && "Username (sem @)"}
                            </Label>
                            <Input required value={social.param_value} onChange={(e) => handleSocialChange(social.id, "param_value", e.target.value)} />
                          </div>

                          {/* Toggle */}
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`vis-${social.id}`}
                              checked={social.is_visible}
                              onCheckedChange={(v) => handleSocialChange(social.id, "is_visible", v)}
                            />
                            <Label htmlFor={`vis-${social.id}`} className="text-sm cursor-pointer">Visível</Label>
                          </div>

                          <Button type="submit" size="sm" className="cursor-pointer">Salvar</Button>
                        </div>
                      </form>
                    </Card>
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

// ---- UPLOAD BLOCK (internal) ----
function UploadBlock({ title, hasFile, fileUrl, uploading, onUpload }: {
  title: string; hasFile: boolean; fileUrl: string; uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>
      {hasFile ? (
        <div className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
          <span className="text-muted-foreground">Arquivo ativo</span>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-foreground hover:text-foreground/80">Ver PDF</a>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum arquivo.</p>
      )}
      <Button variant="outline" size="sm" asChild className="cursor-pointer">
        <label>
          {uploading ? "Enviando..." : "Upload PDF"}
          <input type="file" accept=".pdf" onChange={onUpload} className="hidden" />
        </label>
      </Button>
    </div>
  );
}
