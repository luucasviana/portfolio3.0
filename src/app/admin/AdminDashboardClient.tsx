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
import { 
  UserCog, 
  Briefcase, 
  Layers, 
  Send, 
  Plus, 
  Trash2, 
  ExternalLink, 
  LogOut, 
  FileText, 
  Check, 
  Loader2, 
  AlertTriangle, 
  Image, 
  ArrowUpRight,
  CloudLightning,
  Sparkles
} from "lucide-react";

interface AdminDashboardClientProps {
  isDbInitialized: boolean;
  initialProfile: any;
  initialProjects: any[];
  initialExperience: any[];
  initialSocials: any[];
}

interface Toast {
  id: string;
  text: string;
  type: "success" | "error";
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
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ---- TOAST FEEDBACK ----
  const showToast = (text: string, type: "success" | "error" = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleLogout = async () => { 
    await logoutAction(); 
    window.location.href = "/admin/login"; 
  };

  const handleDbInitialize = async () => {
    setDbLoading(true);
    setDbMessage("Estruturando tabelas e semeando dados de portfólio...");
    try {
      const res = await triggerDbInit();
      if (res.success) { 
        setDbMessage(res.message); 
        setTimeout(() => window.location.reload(), 1500); 
      } else { 
        setDbMessage("Erro: " + res.message); 
        setDbLoading(false); 
      }
    } catch (err: any) { 
      setDbMessage("Erro: " + err.message); 
      setDbLoading(false); 
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    setUploadProgress(15);

    // Smooth progress simulation
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 12 : prev));
    }, 100);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await uploadFileAction(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        if (res.success && res.url) {
          if (field === "cv") { 
            setProfile({ ...profile, cv_url: res.url }); 
            showToast("Currículo enviado com sucesso!"); 
          }
          else if (field === "certificate") { 
            setProfile({ ...profile, certificate_bubble_url: res.url }); 
            showToast("Certificado Bubble enviado!"); 
          }
          else if (field === "experience_logo") { 
            setNewExp({ ...newExp, logo_url: res.url }); 
            showToast("Logomarca carregada!"); 
          }
          else if (field.startsWith("project_")) { 
            setEditingProject({ ...editingProject, link_url: res.url }); 
            showToast("Mídia de projeto salva!"); 
          }
        } else { 
          showToast(res.error || "Falha no upload do arquivo.", "error"); 
        }
        setUploadingField(null);
        setUploadProgress(0);
      }, 300);
    } catch { 
      clearInterval(progressInterval);
      showToast("Erro na conexão com o servidor.", "error"); 
      setUploadingField(null);
      setUploadProgress(0);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
      const res = await updateProfile(profile); 
      if (res.success) {
        showToast("Perfil atualizado com sucesso!"); 
      }
    } catch (err: any) { 
      showToast(err.message || "Erro ao salvar perfil.", "error"); 
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await saveProject({ 
        ...editingProject, 
        tags: typeof editingProject.tags === "string" 
          ? editingProject.tags.split(",").map((t: string) => t.trim()).filter(Boolean) 
          : editingProject.tags 
      });
      if (res.success) {
        showToast(`Projeto "${editingProject.title}" salvo!`);
        const updated = [...projects];
        const idx = projects.findIndex(p => p.id === editingProject.id);
        if (idx !== -1) updated[idx] = editingProject; else updated.push({ ...editingProject, id: `proj_${Date.now()}` });
        setProjects(updated); 
        setEditingProject(null); 
        window.location.reload();
      }
    } catch (err: any) { 
      showToast(err.message || "Erro ao salvar projeto.", "error"); 
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
    if (!confirm("Excluir definitivamente este projeto?")) return;
    try { 
      const res = await deleteProject(id); 
      if (res.success) { 
        setProjects(projects.filter(p => p.id !== id)); 
        showToast("Projeto excluído do catálogo."); 
      } 
    } catch (err: any) { 
      showToast(err.message || "Erro ao excluir.", "error"); 
    }
  };

  const handleExperienceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.company_name) return;
    try {
      const res = await addExperience(newExp);
      if (res.success) { 
        showToast("Empresa adicionada com sucesso!"); 
        setExperiences([...experiences, { ...newExp, id: `exp_${Date.now()}` }]); 
        setNewExp({ company_name: "", logo_text: "", logo_url: "" }); 
        window.location.reload(); 
      }
    } catch (err: any) { 
      showToast(err.message || "Erro ao adicionar empresa.", "error"); 
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Remover esta empresa do carrossel?")) return;
    try { 
      const res = await deleteExperience(id); 
      if (res.success) { 
        setExperiences(experiences.filter(exp => exp.id !== id)); 
        showToast("Empresa removida."); 
      } 
    } catch (err: any) { 
      showToast(err.message || "Erro ao remover.", "error"); 
    }
  };

  const handleSocialSubmit = async (e: React.FormEvent, social: any) => {
    e.preventDefault();
    try { 
      const res = await updateSocialLink({ 
        id: social.id, 
        param_value: social.param_value, 
        is_visible: social.is_visible 
      }); 
      if (res.success) {
        showToast(`${social.platform} atualizado!`); 
      }
    } catch (err: any) { 
      showToast(err.message || "Erro ao salvar.", "error"); 
    }
  };

  const handleSocialChange = (id: string, field: string, value: any) => {
    setSocials(socials.map(soc => soc.id === id ? { ...soc, [field]: value } : soc));
  };

  // ---- NAV TABS ----
  const tabs = [
    { id: "profile", label: "Perfil & Trajetória", icon: UserCog },
    { id: "projects", label: "Projetos", icon: Briefcase },
    { id: "experience", label: "Empresas & Logos", icon: Layers },
    { id: "socials", label: "Conexões & Redes", icon: Send },
  ];

  // ---- DB INIT SCREEN ----
  if (!isDbInitialized) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#0b0d11]">
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "30px 30px"
          }}
        />
        <div className="relative w-full max-w-[420px] bg-[#1c2027] border border-white/5 rounded-xl shadow-2xl p-8 backdrop-blur-xl z-10 text-center">
          <div className="flex items-center justify-center w-11 h-11 bg-[rgba(0,173,181,0.05)] border border-[rgba(0,173,181,0.15)] text-[#00adb5] rounded-lg text-lg mx-auto mb-5 shadow-sm">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-white mb-3">Conexão Estabelecida!</h2>
          <p className="text-xs text-[#718096] leading-relaxed mb-6">
            Sua aplicação foi integrada ao Vercel Postgres e Vercel Blob. Vamos estruturar as tabelas e popular o banco.
          </p>
          
          {dbMessage && (
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs text-[#00adb5] font-medium animate-pulse mb-6">
              {dbMessage}
            </div>
          )}

          <Button 
            onClick={handleDbInitialize} 
            disabled={dbLoading} 
            className="w-full h-11 bg-[#00adb5] hover:bg-[#00adb5]/90 text-white font-medium rounded-lg text-sm shadow-lg shadow-[#00adb5]/10 cursor-pointer transition-all active:scale-[0.98]"
          >
            {dbLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0 mr-2" />
                <span>Inicializando Tabelas...</span>
              </>
            ) : (
              <span>Inicializar Banco de Dados</span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ---- MAIN DASHBOARD ----
  return (
    <div className="min-h-screen flex flex-col bg-[#12151a] text-[#eeeeee] font-sans pb-16 md:pb-0">

      {/* TOAST CONTAINER */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-2.5 pointer-events-auto rounded-lg border px-4 py-3 text-xs font-medium shadow-xl min-w-[280px] bg-[#1c2027] animate-toast-in",
              toast.type === "error"
                ? "border-red-500/20 text-red-400"
                : "border-emerald-500/20 text-emerald-400"
            )}
          >
            {toast.type === "error" ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-[#141821]/70 backdrop-blur-md px-6">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            LV<span className="text-[#00adb5]">.</span>
          </span>
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <span className="text-xs text-[#718096] bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-full">
            Console Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-[#718096] hover:text-white hover:bg-white/[0.02] cursor-pointer">
            <a href="/" target="_blank" className="no-underline inline-flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Ver Site</span>
            </a>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Sair
          </Button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        {/* SIDEBAR (Desktop Only) */}
        <aside className="hidden md:flex w-60 flex-col border-r border-white/5 bg-[#12151a]/40 p-4 gap-1">
          <p className="px-3 py-2 text-[10px] font-semibold text-[#718096] uppercase tracking-wider">Menu</p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== "projects") setEditingProject(null); }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all cursor-pointer text-left w-full",
                  activeTab === tab.id
                    ? "bg-[#242933] border border-white/5 text-white shadow-sm"
                    : "text-[#718096] hover:bg-white/[0.02] hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", activeTab === tab.id ? "text-[#00adb5]" : "")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="mx-auto max-w-3xl space-y-6">

            {/* ======== PROFILE TAB ======== */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="mb-6">
                  <h2 className="font-heading text-xl font-semibold text-white tracking-tight">Perfil & Trajetória</h2>
                  <p className="text-xs text-[#718096] mt-1">Configure as informações da página inicial e da seção Sobre Mim.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Apresentação */}
                  <Card className="bg-[#1c2027] border border-white/5 shadow-md">
                    <CardHeader className="border-b border-white/5 py-4 px-6">
                      <CardTitle className="text-sm font-semibold text-white">Apresentação Principal</CardTitle>
                      <CardDescription className="text-xs text-[#718096]">Nome, subtítulo e descrição visíveis no hero da página.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-xs text-white">Nome de Exibição</Label>
                          <Input id="name" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="h-10 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/20 placeholder:text-[#718096]" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subtitle" className="text-xs text-white">Subtítulo (Tagline)</Label>
                          <Input id="subtitle" required value={profile.subtitle} onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })} className="h-10 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/20 placeholder:text-[#718096]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="desc" className="text-xs text-white">Descrição do Hero</Label>
                        <Textarea id="desc" rows={3} required value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} className="bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/20 placeholder:text-[#718096] resize-none" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Biografia */}
                  <Card className="bg-[#1c2027] border border-white/5 shadow-md">
                    <CardHeader className="border-b border-white/5 py-4 px-6">
                      <CardTitle className="text-sm font-semibold text-white">Sobre Mim (Biografia)</CardTitle>
                      <CardDescription className="text-xs text-[#718096]">Os três parágrafos estruturados de biografia exibidos na seção sobre.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {(["bio_p1", "bio_p2", "bio_p3"] as const).map((field, i) => (
                        <div key={field} className="space-y-2">
                          <Label className="text-xs text-white">{`${i + 1}º Parágrafo`}</Label>
                          <Textarea rows={3} required value={profile[field]} onChange={(e) => setProfile({ ...profile, [field]: e.target.value })} className="bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/20 placeholder:text-[#718096] resize-none" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Uploads */}
                  <Card className="bg-[#1c2027] border border-white/5 shadow-md">
                    <CardHeader className="border-b border-white/5 py-4 px-6">
                      <CardTitle className="text-sm font-semibold text-white">Documentos & Anexos</CardTitle>
                      <CardDescription className="text-xs text-[#718096]">Arquivos em formato PDF salvos com segurança no Vercel Blob.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <UploadBlock
                          title="Currículo (CV)"
                          hasFile={!!profile.cv_url}
                          fileUrl={profile.cv_url}
                          uploading={uploadingField === "cv"}
                          uploadProgress={uploadProgress}
                          onUpload={(e) => handleFileUpload(e, "cv")}
                          visible={profile.cv_visible !== false}
                          onVisibleChange={(v) => setProfile({ ...profile, cv_visible: v })}
                        />
                        <UploadBlock
                          title="Certificado Bubble"
                          hasFile={!!profile.certificate_bubble_url}
                          fileUrl={profile.certificate_bubble_url}
                          uploading={uploadingField === "certificate"}
                          uploadProgress={uploadProgress}
                          onUpload={(e) => handleFileUpload(e, "certificate")}
                          visible={profile.certificate_bubble_visible !== false}
                          onVisibleChange={(v) => setProfile({ ...profile, certificate_bubble_visible: v })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" className="h-10 px-6 bg-[#00adb5] hover:bg-[#00adb5]/90 text-white font-medium text-xs rounded-lg cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-[#00adb5]/5">
                    Salvar Alterações
                  </Button>
                </form>
              </div>
            )}

            {/* ======== PROJECTS TAB ======== */}
            {activeTab === "projects" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-white tracking-tight">Projetos</h2>
                    <p className="text-xs text-[#718096] mt-1">Gerencie os cartões de projetos da grade de destaques.</p>
                  </div>
                  {!editingProject && (
                    <Button onClick={handleNewProjectClick} className="h-9 px-4 bg-[#00adb5] hover:bg-[#00adb5]/90 text-white font-medium text-xs rounded-lg cursor-pointer transition-all inline-flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </Button>
                  )}
                </div>

                {editingProject ? (
                  <Card className="bg-[#1c2027] border border-white/5 shadow-md">
                    <CardHeader className="border-b border-white/5 py-4 px-6">
                      <CardTitle className="text-sm font-semibold text-white">
                        {editingProject.id ? `Editar: ${editingProject.title}` : "Novo Projeto"}
                      </CardTitle>
                      <CardDescription className="text-xs text-[#718096]">Insira as informações técnicas para a visualização no portfólio.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handleProjectSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-xs text-white">Título do Projeto</Label>
                            <Input required value={editingProject.title} onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })} className="h-10 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5]" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-white">Categoria</Label>
                            <Input required placeholder="ex: SaaS B2B, Mobile" value={editingProject.category} onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })} className="h-10 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5]" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-white">Descrição Resumida</Label>
                          <Textarea rows={3} required value={editingProject.description} onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })} className="bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5] resize-none" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-white">Tecnologias (separadas por vírgula)</Label>
                          <Input required placeholder="React, TypeScript, Supabase" value={Array.isArray(editingProject.tags) ? editingProject.tags.join(", ") : editingProject.tags} onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value })} className="h-10 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5]" />
                        </div>

                        <Separator className="bg-white/5 my-4" />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-3 rounded-lg border border-white/5 p-4 bg-white/[0.01]">
                            <p className="text-xs font-semibold text-white">Link Principal</p>
                            <div className="space-y-2">
                              <Label className="text-[11px] text-[#718096]">Texto do Botão</Label>
                              <Input required value={editingProject.link_label} onChange={(e) => setEditingProject({ ...editingProject, link_label: e.target.value })} className="h-9 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5]" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] text-[#718096]">URL de Redirecionamento</Label>
                              <Input required value={editingProject.link_url} onChange={(e) => setEditingProject({ ...editingProject, link_url: e.target.value })} className="h-9 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5]" />
                            </div>
                          </div>
                          <div className="space-y-3 rounded-lg border border-white/5 p-4 bg-white/[0.01]">
                            <p className="text-xs font-semibold text-[#718096]">Link Secundário (opcional)</p>
                            <div className="space-y-2">
                              <Label className="text-[11px] text-[#718096]">Texto do Botão</Label>
                              <Input value={editingProject.secondary_link_label || ""} onChange={(e) => setEditingProject({ ...editingProject, secondary_link_label: e.target.value })} className="h-9 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5]" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] text-[#718096]">URL de Redirecionamento</Label>
                              <Input value={editingProject.secondary_link || ""} onChange={(e) => setEditingProject({ ...editingProject, secondary_link: e.target.value })} className="h-9 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5]" />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button type="submit" className="h-9 px-4 bg-[#00adb5] hover:bg-[#00adb5]/90 text-white font-medium text-xs rounded-lg cursor-pointer transition-all active:scale-[0.98]">
                            Salvar Projeto
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setEditingProject(null)} className="h-9 px-4 border-white/5 bg-[#242933] hover:bg-white/[0.02] hover:text-white text-xs rounded-lg cursor-pointer">
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-5 bg-[#1c2027] border border-white/5 rounded-xl shadow-sm hover:border-[#00adb5]/20 transition-all duration-300 group">
                        <div className="space-y-1.5 min-w-0 pr-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] h-5 bg-[#242933] text-[#718096] border border-white/5 rounded font-medium">
                              {project.category}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm text-white group-hover:text-[#00adb5] transition-colors">{project.title}</h4>
                          <p className="text-xs text-[#718096] line-clamp-1 font-light leading-relaxed">{project.description}</p>
                          
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(Array.isArray(project.tags) ? project.tags : []).map((tag: string, i: number) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.02] border border-white/5 text-[#718096]">
                                <span className="w-1 h-1 rounded-full bg-[#00adb5]" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => setEditingProject(project)} className="h-8 px-3 text-xs border-white/5 hover:bg-white/[0.02] text-[#718096] hover:text-white cursor-pointer">
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteProject(project.id)} 
                            className="h-8 px-3 text-xs border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-400 cursor-pointer transition-all"
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/5 bg-[#1c2027]/20 p-12 text-center text-xs text-[#718096] leading-relaxed">
                        Nenhum projeto cadastrado no portfólio.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ======== EXPERIENCE TAB ======== */}
            {activeTab === "experience" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-white tracking-tight">Experiência & Logos</h2>
                  <p className="text-xs text-[#718096] mt-1">Gerencie as empresas e logos exibidas no carrossel infinito.</p>
                </div>

                <Card className="bg-[#1c2027] border border-white/5 shadow-md">
                  <CardHeader className="border-b border-white/5 py-4 px-6">
                    <CardTitle className="text-sm font-semibold text-white">Adicionar Empresa</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleExperienceSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-white">Nome da Empresa</Label>
                          <Input 
                            required 
                            placeholder="ex: InfoEduc" 
                            value={newExp.company_name} 
                            onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value, logo_text: e.target.value })} 
                            className="h-10 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5]" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-white">Logomarca (opcional)</Label>
                          <div className="flex items-center gap-3 pt-0.5">
                            <Button variant="outline" size="sm" asChild className="h-9 text-xs border-white/5 bg-[#242933] hover:bg-white/[0.02] hover:text-white cursor-pointer">
                              <label>
                                Escolher Imagem
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "experience_logo")} className="hidden" />
                              </label>
                            </Button>
                            {uploadingField === "experience_logo" && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[#718096] animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin shrink-0 text-[#00adb5]" />
                                <span>{uploadProgress}%</span>
                              </div>
                            )}
                            {newExp.logo_url && <span className="text-[11px] text-[#00adb5] font-medium">✓ Pronto</span>}
                          </div>
                        </div>
                      </div>
                      <Button type="submit" className="h-9 px-4 bg-[#00adb5] hover:bg-[#00adb5]/90 text-white font-medium text-xs rounded-lg cursor-pointer transition-all active:scale-[0.98]">
                        Adicionar
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold text-[#718096] uppercase tracking-wider">Marcas Ativas ({experiences.length})</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between p-4 bg-[#1c2027] border border-white/5 rounded-xl shadow-sm hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#242933] border border-white/5 text-[11px] font-bold shrink-0 text-[#00adb5]">
                            {exp.logo_url ? (
                              <img src={exp.logo_url} alt={exp.company_name} className="max-w-[70%] max-h-[70%] object-contain" />
                            ) : (
                              exp.company_name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate text-white leading-normal">{exp.company_name}</p>
                            <p className="text-[10px] text-[#718096] truncate">{exp.logo_url ? "Logomarca ativa" : "Nome em texto"}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteExperience(exp.id)} 
                          className="h-8 w-8 p-0 text-[#718096] hover:text-red-400 hover:bg-red-500/5 cursor-pointer rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {experiences.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/5 bg-[#1c2027]/20 p-12 text-center text-xs text-[#718096] leading-relaxed">
                      Nenhuma empresa cadastrada no carrossel.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======== SOCIALS TAB ======== */}
            {activeTab === "socials" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-white tracking-tight">Conexões & Redes</h2>
                  <p className="text-xs text-[#718096] mt-1">Configure os links e chaves de visibilidade de suas principais conexões.</p>
                </div>

                <div className="space-y-3">
                  {socials.map((social) => (
                    <Card key={social.id} className="bg-[#1c2027] border border-white/5 shadow-sm overflow-hidden">
                      <form onSubmit={(e) => handleSocialSubmit(e, social)}>
                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
                          
                          {/* Platform info */}
                          <div className="flex items-center gap-3 sm:w-44 shrink-0">
                            <div 
                              className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm shrink-0" 
                              style={{ 
                                color: social.brandColor,
                                backgroundColor: `${social.brandColor}0d`,
                                borderColor: `${social.brandColor}26`
                              }}
                            >
                              <i className={cn(social.icon)} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate leading-normal">{social.platform}</p>
                              <p className="text-[10px] text-[#718096] truncate">{social.subtitle}</p>
                            </div>
                          </div>

                          {/* Param input */}
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <Label className="text-[10px] text-[#718096] font-medium tracking-wide uppercase">
                              {social.platform === "WhatsApp" && "Número (com DDD)"}
                              {social.platform === "E-mail" && "E-mail principal"}
                              {social.platform === "GitHub" && "GitHub Username"}
                              {social.platform === "LinkedIn" && "LinkedIn Username"}
                              {social.platform === "Instagram" && "Instagram (sem @)"}
                            </Label>
                            <Input 
                              required 
                              value={social.param_value} 
                              onChange={(e) => handleSocialChange(social.id, "param_value", e.target.value)} 
                              className="h-10 bg-white/[0.01] border-white/5 text-xs text-white focus:border-[#00adb5]"
                            />
                          </div>

                          {/* Actions area */}
                          <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`vis-${social.id}`}
                                checked={social.is_visible}
                                onCheckedChange={(v) => handleSocialChange(social.id, "is_visible", v)}
                                className="scale-90 data-[state=checked]:bg-[#00adb5]"
                              />
                              <Label htmlFor={`vis-${social.id}`} className="text-xs text-[#718096] cursor-pointer">Visível</Label>
                            </div>

                            <Button type="submit" className="h-9 px-4 bg-[#242933] hover:bg-[#00adb5] text-white hover:text-white border border-white/5 text-xs font-medium rounded-lg cursor-pointer transition-all">
                              Salvar
                            </Button>
                          </div>

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

      {/* MOBILE BOTTOM NAVIGATION DOCK */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 h-14 bg-[#1c2027]/90 backdrop-blur-xl border border-white/5 rounded-full flex items-center justify-around px-3 z-40 shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== "projects") setEditingProject(null); }}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 text-[#718096] cursor-pointer transition-colors w-14",
                activeTab === tab.id ? "text-[#00adb5]" : "hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[9px] font-medium tracking-wide">
                {tab.id === "profile" && "Perfil"}
                {tab.id === "projects" && "Projetos"}
                {tab.id === "experience" && "Marcas"}
                {tab.id === "socials" && "Redes"}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}

// ---- INTERNAL COMPONENTS ----

interface UploadBlockProps {
  title: string;
  hasFile: boolean;
  fileUrl: string;
  uploading: boolean;
  uploadProgress: number;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  visible: boolean;
  onVisibleChange: (v: boolean) => void;
}

function UploadBlock({ 
  title, 
  hasFile, 
  fileUrl, 
  uploading, 
  uploadProgress, 
  onUpload,
  visible,
  onVisibleChange
}: UploadBlockProps) {
  return (
    <div className="space-y-3.5 p-4 bg-white/[0.01] border border-white/5 rounded-xl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white">{title}</p>
        {hasFile && (
          <div className="flex items-center gap-1.5">
            <Switch
              id={`vis-${title.replace(/\s+/g, "-")}`}
              checked={visible}
              onCheckedChange={onVisibleChange}
              className="scale-75 data-[state=checked]:bg-[#00adb5]"
            />
            <Label htmlFor={`vis-${title.replace(/\s+/g, "-")}`} className="text-[10px] text-[#718096] cursor-pointer">Visível</Label>
          </div>
        )}
      </div>
      
      {hasFile ? (
        <div className="flex items-center justify-between rounded-lg border border-white/5 p-3 text-xs bg-white/[0.01]">
          <span className="text-[#718096] inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#00adb5]" />
            Ativo
          </span>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-[#00adb5] hover:underline inline-flex items-center gap-1"
          >
            <span>Ver PDF</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <p className="text-xs text-[#718096] italic">Nenhum arquivo ativo.</p>
      )}

      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" asChild className="h-9 text-xs border-white/5 bg-[#242933] hover:bg-white/[0.02] hover:text-white cursor-pointer w-full">
          <label className="w-full h-full flex items-center justify-center cursor-pointer">
            {uploading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin shrink-0 text-[#00adb5]" />
                Enviando ({uploadProgress}%)
              </span>
            ) : (
              <span>Upload PDF</span>
            )}
            <input type="file" accept=".pdf" onChange={onUpload} className="hidden" disabled={uploading} />
          </label>
        </Button>
        {uploading && (
          <div className="w-full bg-[#242933] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#00adb5] h-full transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
