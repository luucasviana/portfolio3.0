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
  };  // --------------------------------------------------------------------------
  // RENDER: UNINITIALIZED DATABASE PORTAL
  // --------------------------------------------------------------------------
  if (!isDbInitialized) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center p-4 text-center select-none"
        style={{ 
          backgroundColor: "#0B0F17", 
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0, 173, 181, 0.04) 0%, transparent 60%)",
          color: "#eeeeee", 
          fontFamily: "'Plus Jakarta Sans', sans-serif" 
        }}
      >
        <div 
          className="max-w-[480px] w-full p-8 md:p-10 rounded-[28px] relative overflow-hidden transition-all duration-500 animate-[fadeInUp_0.5s_ease-out]"
          style={{
            background: "rgba(17, 24, 39, 0.65)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          }}
        >
          <div 
            className="w-16 h-16 rounded-[20px] mx-auto flex items-center justify-center text-2xl mb-6 transition-transform hover:scale-105 duration-300"
            style={{ 
              background: "linear-gradient(135deg, rgba(0, 173, 181, 0.2), rgba(0, 173, 181, 0.05))",
              border: "1px solid rgba(0, 173, 181, 0.25)",
              color: "#00adb5",
              boxShadow: "0 10px 25px -8px rgba(0, 173, 181, 0.4)"
            }}
          >
            <i className="fa-solid fa-database"></i>
          </div>
          
          <h1 className="text-2xl font-black mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-300">
            Conexão Estabelecida!
          </h1>
          
          <p className="text-xs font-light text-slate-400 mb-8 leading-relaxed px-2">
            Sua aplicação Next.js foi integrada com sucesso ao **Vercel Postgres (Neon)** e **Vercel Blob**! 
            Agora vamos estruturar as tabelas e povoar o banco com as suas informações.
          </p>

          {dbMessage && (
            <div className="text-[11px] mb-6 text-[#00adb5] font-semibold animate-pulse py-2 px-4 rounded-lg bg-[#00adb5]/5 border border-[#00adb5]/10">
              <i className="fa-solid fa-spinner fa-spin mr-1.5"></i> {dbMessage}
            </div>
          )}

          <button
            onClick={handleDbInitialize}
            disabled={dbLoading}
            className="w-full py-3.5 rounded-[14px] font-bold text-sm tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: dbLoading 
                ? "rgba(0, 173, 181, 0.4)" 
                : "linear-gradient(135deg, #00adb5 0%, #00989f 100%)",
              color: "#ffffff",
              boxShadow: "0 8px 25px -4px rgba(0, 173, 181, 0.3)"
            }}
          >
            {dbLoading ? (
              <>
                Criando Tabelas...
              </>
            ) : (
              <>
                Inicializar Banco de Dados <i className="fa-solid fa-bolt-lightning ml-0.5"></i>
              </>
            )}
          </button>
          
          <div className="mt-8 text-[10px] text-slate-600 font-medium flex items-center justify-center gap-3 uppercase tracking-wider">
            <span>Next.js</span>
            <span>•</span>
            <span>Vercel Postgres</span>
            <span>•</span>
            <span>Vercel Blob</span>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: SECURE EDITOR PORTAL
  // --------------------------------------------------------------------------
  return (
    <div 
      className="min-h-screen w-full flex flex-col"
      style={{
        backgroundColor: "#080B10",
        color: "#eeeeee",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Toast Alert */}
      {statusMsg.text && (
        <div 
          className="fixed top-6 right-6 px-5 py-3 rounded-xl z-50 shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all duration-300 animate-[slideIn_0.3s_ease-out]"
          style={{
            background: statusMsg.type === "error" ? "rgba(239, 68, 68, 0.95)" : "rgba(0, 173, 181, 0.95)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${statusMsg.type === "error" ? "rgba(239,68,68,0.2)" : "rgba(0, 173, 181, 0.2)"}`,
            color: "#ffffff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}
        >
          <i className={statusMsg.type === "error" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-check"}></i>
          {statusMsg.text}
        </div>
      )}

      {/* Main Admin Navbar */}
      <header 
        className="w-full px-8 py-4 flex items-center justify-between border-b"
        style={{ 
          background: "rgba(13, 18, 28, 0.6)", 
          backdropFilter: "blur(16px)", 
          borderColor: "rgba(255, 255, 255, 0.04)" 
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight" style={{ color: "#eeeeee" }}>
            LV<span style={{ color: "#00adb5" }}>.</span>
          </span>
          <span className="text-[10px] px-2.5 py-1 rounded-md uppercase font-bold tracking-wider" style={{ background: "rgba(0, 173, 181, 0.08)", color: "#00adb5", border: "1px solid rgba(0, 173, 181, 0.15)" }}>
            Admin Console
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <a 
            href="/" 
            className="text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5 border border-white/5 flex items-center gap-1.5"
            style={{ color: "#94a3b8", textDecoration: "none" }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square"></i> Ver Site
          </a>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:bg-red-500/10 border border-red-500/10 cursor-pointer flex items-center gap-1.5"
            style={{ color: "#f87171" }}
          >
            Sair <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </header>

      {/* Dashboard Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Side Tab Navigation Menu */}
        <aside 
          className="w-full md:w-[260px] p-6 border-r flex flex-col gap-1.5"
          style={{ borderColor: "rgba(255, 255, 255, 0.04)", background: "rgba(13, 18, 28, 0.25)" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2.5 block">
            Editor de Conteúdo
          </span>

          <button
            onClick={() => { setActiveTab("profile"); setEditingProject(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-3 cursor-pointer border ${
              activeTab === "profile" 
                ? "bg-gradient-to-r from-[#00adb5]/12 to-[#00adb5]/4 border-[#00adb5]/25 text-[#00adb5] shadow-lg shadow-[#00adb5]/5" 
                : "text-slate-400 border-transparent hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="fa-solid fa-user-gear text-sm"></i> Perfil & Trajetória
          </button>

          <button
            onClick={() => { setActiveTab("projects"); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-3 cursor-pointer border ${
              activeTab === "projects" 
                ? "bg-gradient-to-r from-[#00adb5]/12 to-[#00adb5]/4 border-[#00adb5]/25 text-[#00adb5] shadow-lg shadow-[#00adb5]/5" 
                : "text-slate-400 border-transparent hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="fa-solid fa-briefcase text-sm"></i> Projetos
          </button>

          <button
            onClick={() => { setActiveTab("experience"); setEditingProject(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-3 cursor-pointer border ${
              activeTab === "experience" 
                ? "bg-gradient-to-r from-[#00adb5]/12 to-[#00adb5]/4 border-[#00adb5]/25 text-[#00adb5] shadow-lg shadow-[#00adb5]/5" 
                : "text-slate-400 border-transparent hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="fa-solid fa-layer-group text-sm"></i> Empresas & Logos
          </button>

          <button
            onClick={() => { setActiveTab("socials"); setEditingProject(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-3 cursor-pointer border ${
              activeTab === "socials" 
                ? "bg-gradient-to-r from-[#00adb5]/12 to-[#00adb5]/4 border-[#00adb5]/25 text-[#00adb5] shadow-lg shadow-[#00adb5]/5" 
                : "text-slate-400 border-transparent hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="fa-solid fa-paper-plane text-sm"></i> Conexões & Redes
          </button>
        </aside>

        {/* Right Side Content Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1000px] mx-auto w-full">
          
          {/* TAB: PROFILE (Hero & Sobre) */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-8 animate-[fadeInUp_0.4s_ease-out]">
              <div>
                <h2 className="text-xl font-black tracking-tight">Perfil & Trajetória</h2>
                <p className="text-xs font-medium text-slate-400 mt-1">Gerencie os textos em destaque da página inicial e a sua biografia profissional.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
                
                {/* Card Geral */}
                <div 
                  className="p-6 md:p-8 rounded-2xl flex flex-col gap-5"
                  style={{
                    background: "rgba(17, 24, 39, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                  }}
                >
                  <div className="border-b border-white/[0.04] pb-3 mb-1">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Apresentação Principal</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nome de Exibição</label>
                      <input 
                        type="text" 
                        required
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 transition-all text-slate-200"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subtítulo (Tagline)</label>
                      <input 
                        type="text" 
                        required
                        value={profile.subtitle}
                        onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 transition-all text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Descrição (Hero)</label>
                    <textarea 
                      rows={3}
                      required
                      value={profile.description}
                      onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 transition-all resize-none text-slate-200 leading-relaxed"
                    />
                  </div>
                </div>

                {/* Card Trajetória */}
                <div 
                  className="p-6 md:p-8 rounded-2xl flex flex-col gap-5"
                  style={{
                    background: "rgba(17, 24, 39, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                  }}
                >
                  <div className="border-b border-white/[0.04] pb-3 mb-1">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Sobre Mim (Sua História)</h3>
                  </div>
                  
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Primeiro Parágrafo</label>
                      <textarea 
                        rows={3}
                        required
                        value={profile.bio_p1}
                        onChange={(e) => setProfile({ ...profile, bio_p1: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 transition-all resize-none text-slate-200 leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Segundo Parágrafo</label>
                      <textarea 
                        rows={3}
                        required
                        value={profile.bio_p2}
                        onChange={(e) => setProfile({ ...profile, bio_p2: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 transition-all resize-none text-slate-200 leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Terceiro Parágrafo</label>
                      <textarea 
                        rows={3}
                        required
                        value={profile.bio_p3}
                        onChange={(e) => setProfile({ ...profile, bio_p3: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 transition-all resize-none text-slate-200 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Uploads */}
                <div 
                  className="p-6 md:p-8 rounded-2xl flex flex-col gap-5"
                  style={{
                    background: "rgba(17, 24, 39, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                  }}
                >
                  <div className="border-b border-white/[0.04] pb-3 mb-1">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Anexos e Documentos (Vercel Blob)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CV PDF Upload */}
                    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-[#0B0F17]/30 border border-white/5">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Download do Currículo (CV)</span>
                      
                      {profile.cv_url ? (
                        <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-green-500/5 border border-green-500/10 mb-1">
                          <span className="text-[10px] font-bold text-green-400 flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-check"></i> Currículo Ativo
                          </span>
                          <a 
                            href={profile.cv_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[9px] font-black text-slate-400 hover:text-white underline"
                          >
                            Visualizar PDF
                          </a>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic mb-1 px-1">Nenhum arquivo enviado ainda</div>
                      )}

                      <label className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-white/5 hover:border-[#00adb5]/25 rounded-2xl bg-[#0B0F17]/50 hover:bg-[#0B0F17]/80 cursor-pointer transition-all duration-300 group">
                        <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-500 group-hover:text-[#00adb5] mb-2 transition-colors"></i>
                        <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">Fazer Upload de Novo PDF</span>
                        <span className="text-[8px] text-slate-500 mt-0.5">Selecione arquivos .pdf de até 5MB</span>
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => handleFileUpload(e, "cv")}
                          className="hidden"
                        />
                      </label>
                      
                      {uploadingField === "cv" && (
                        <div className="flex items-center gap-2 text-[10px] text-[#00adb5] font-bold px-1 animate-pulse">
                          <i className="fa-solid fa-spinner fa-spin"></i> Enviando PDF para o Vercel Blob...
                        </div>
                      )}
                    </div>

                    {/* Bubble Certificate PDF Upload */}
                    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-[#0B0F17]/30 border border-white/5">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Certificado Bubble</span>
                      
                      {profile.certificate_bubble_url ? (
                        <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-green-500/5 border border-green-500/10 mb-1">
                          <span className="text-[10px] font-bold text-green-400 flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-check"></i> Certificado Ativo
                          </span>
                          <a 
                            href={profile.certificate_bubble_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[9px] font-black text-slate-400 hover:text-white underline"
                          >
                            Visualizar PDF
                          </a>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic mb-1 px-1">Nenhum arquivo enviado ainda</div>
                      )}

                      <label className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-white/5 hover:border-[#00adb5]/25 rounded-2xl bg-[#0B0F17]/50 hover:bg-[#0B0F17]/80 cursor-pointer transition-all duration-300 group">
                        <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-500 group-hover:text-[#00adb5] mb-2 transition-colors"></i>
                        <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">Fazer Upload de Novo PDF</span>
                        <span className="text-[8px] text-slate-500 mt-0.5">Selecione arquivos .pdf de até 5MB</span>
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => handleFileUpload(e, "certificate")}
                          className="hidden"
                        />
                      </label>

                      {uploadingField === "certificate" && (
                        <div className="flex items-center gap-2 text-[10px] text-[#00adb5] font-bold px-1 animate-pulse">
                          <i className="fa-solid fa-spinner fa-spin"></i> Enviando PDF para o Vercel Blob...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="px-6 py-3.5 bg-gradient-to-r from-[#00adb5] to-[#00989f] hover:from-[#00c2cb] hover:to-[#00a6ad] text-white font-bold rounded-xl text-xs transition duration-300 shadow-lg shadow-[#00adb5]/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer self-start"
                >
                  Salvar Perfil & Trajetória <i className="fa-solid fa-circle-check ml-1"></i>
                </button>
              </form>
            </div>
          )}

          {/* TAB: PROJECTS (CRUD) */}
          {activeTab === "projects" && (
            <div className="flex flex-col gap-6 animate-[fadeInUp_0.4s_ease-out]">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Gestão de Projetos</h2>
                  <p className="text-xs font-medium text-slate-400 mt-1">Crie e gerencie os projetos que serão apresentados em destaque no seu portfólio.</p>
                </div>
                {!editingProject && (
                  <button 
                    onClick={handleNewProjectClick}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#00adb5] to-[#00989f] text-white font-bold text-xs rounded-xl transition hover:from-[#00c2cb] hover:to-[#00a6ad] cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
                  >
                    <i className="fa-solid fa-plus"></i> Novo Projeto
                  </button>
                )}
              </div>

              {/* Editing or Creating Project Form */}
              {editingProject ? (
                <div 
                  className="p-6 md:p-8 rounded-2xl flex flex-col gap-6 animate-[fadeIn_0.3s_ease]"
                  style={{
                    background: "rgba(17, 24, 39, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                  }}
                >
                  <div className="border-b border-white/[0.04] pb-3 mb-1">
                    <h3 className="text-xs font-bold text-[#00adb5] uppercase tracking-wider">
                      {editingProject.id ? `Editar Projeto: ${editingProject.title}` : "Adicionar Novo Projeto"}
                    </h3>
                  </div>
                  
                  <form onSubmit={handleProjectSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Título do Projeto</label>
                        <input 
                          type="text" required
                          value={editingProject.title}
                          onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                          className="px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 text-slate-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categoria / Escopo</label>
                        <input 
                          type="text" required placeholder="ex: SaaS B2B / IA"
                          value={editingProject.category}
                          onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                          className="px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Descrição Detalhada</label>
                      <textarea 
                        rows={3} required
                        value={editingProject.description}
                        onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                        className="px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 resize-none text-slate-200 leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Habilidades / Badges (Separadas por vírgula)</label>
                      <input 
                        type="text" required placeholder="ex: React, TypeScript, Supabase, Playwright"
                        value={Array.isArray(editingProject.tags) ? editingProject.tags.join(", ") : editingProject.tags}
                        onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value })}
                        className="px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 text-slate-200"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-white/[0.04] pt-5 mt-2">
                      {/* Main Action Link */}
                      <div className="flex flex-col gap-3.5 p-5 rounded-2xl bg-[#0B0F17]/30 border border-white/5">
                        <span className="text-[11px] font-bold text-[#00adb5] uppercase tracking-wider">Link da Ação Principal</span>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500 font-semibold uppercase">Título do Botão (ex: Conhecer o SaaS)</label>
                          <input 
                            type="text" required
                            value={editingProject.link_label}
                            onChange={(e) => setEditingProject({ ...editingProject, link_label: e.target.value })}
                            className="px-3.5 py-2.5 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500 font-semibold uppercase">URL de Destino</label>
                          <input 
                            type="text" required
                            value={editingProject.link_url}
                            onChange={(e) => setEditingProject({ ...editingProject, link_url: e.target.value })}
                            className="px-3.5 py-2.5 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none"
                          />
                        </div>
                      </div>

                      {/* Secondary Action Link */}
                      <div className="flex flex-col gap-3.5 p-5 rounded-2xl bg-[#0B0F17]/30 border border-white/5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Link Secundário (Opcional)</span>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500 font-semibold uppercase">Título do Botão (ex: Figma / Código)</label>
                          <input 
                            type="text"
                            value={editingProject.secondary_link_label || ""}
                            onChange={(e) => setEditingProject({ ...editingProject, secondary_link_label: e.target.value })}
                            className="px-3.5 py-2.5 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500 font-semibold uppercase">URL de Destino</label>
                          <input 
                            type="text"
                            value={editingProject.secondary_link || ""}
                            onChange={(e) => setEditingProject({ ...editingProject, secondary_link: e.target.value })}
                            className="px-3.5 py-2.5 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <button 
                        type="submit"
                        className="px-5 py-2.5 bg-[#00adb5] text-white font-bold text-xs rounded-xl hover:bg-[#00c2cb] cursor-pointer transition shadow-lg shadow-[#00adb5]/10"
                      >
                        Salvar Projeto
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingProject(null)}
                        className="px-5 py-2.5 bg-transparent text-slate-400 font-semibold text-xs rounded-xl hover:bg-white/5 border border-white/5 cursor-pointer transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Projects List Grid */
                <div className="flex flex-col gap-4">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition duration-300 hover:bg-white/[0.01]"
                      style={{
                        background: "rgba(17, 24, 39, 0.35)",
                        border: "1px solid rgba(255, 255, 255, 0.04)"
                      }}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-bold text-[#00adb5] uppercase tracking-wider py-1 px-2.5 rounded bg-[#00adb5]/10 border border-[#00adb5]/20">{project.category}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white">{project.title}</h4>
                        <p className="text-xs text-slate-400 font-light mt-1.5 leading-relaxed line-clamp-2 max-w-[650px]">{project.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(Array.isArray(project.tags) ? project.tags : []).map((tag: string, i: number) => (
                            <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-white/5 border border-white/[0.04] text-slate-400 rounded-md">{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button 
                          onClick={() => setEditingProject(project)}
                          className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-300 font-bold hover:bg-white/10 hover:text-white cursor-pointer transition flex items-center gap-1"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-3.5 py-2 rounded-xl bg-red-500/5 border border-red-500/10 text-[11px] text-[#f87171] font-bold hover:bg-red-500/15 cursor-pointer transition flex items-center gap-1"
                        >
                          <i className="fa-solid fa-trash"></i> Excluir
                        </button>
                      </div>
                    </div>
                  ))}

                  {projects.length === 0 && (
                    <div className="text-center py-16 text-slate-500 text-xs italic border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                      Nenhum projeto cadastrado no banco.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: EXPERIENCE & LOGOS */}
          {activeTab === "experience" && (
            <div className="flex flex-col gap-8 animate-[fadeInUp_0.4s_ease-out]">
              <div>
                <h2 className="text-xl font-black tracking-tight">Carrossel de Experiência</h2>
                <p className="text-xs font-medium text-slate-400 mt-1">Configure as empresas e os crachás textuais que aparecem rolando no marquete vertical.</p>
              </div>

              {/* Add New Experience Logo Form */}
              <div 
                className="p-6 md:p-8 rounded-2xl flex flex-col gap-5"
                style={{
                  background: "rgba(17, 24, 39, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                }}
              >
                <div className="border-b border-white/[0.04] pb-3 mb-1">
                  <h3 className="text-xs font-bold text-[#00adb5] uppercase tracking-wider">Adicionar Empresa ao Carrossel</h3>
                </div>
                
                <form onSubmit={handleExperienceSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nome da Empresa</label>
                      <input 
                        type="text" required placeholder="ex: InfoEduc"
                        value={newExp.company_name}
                        onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value, logo_text: e.target.value })}
                        className="px-4 py-3 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 focus:ring-2 focus:ring-[#00adb5]/5 text-slate-200"
                      />
                    </div>
                    {/* Optional URL input or dynamic logo image upload */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Imagem Logo (Upload - Opcional)</label>
                      <div className="flex items-center gap-3">
                        <label className="relative px-4 py-2 border border-dashed border-white/10 hover:border-[#00adb5]/30 rounded-xl bg-[#0B0F17]/60 hover:bg-[#0B0F17]/90 cursor-pointer text-xs font-bold text-slate-300 transition duration-300">
                          <i className="fa-solid fa-image mr-1"></i> Escolher Imagem
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "experience_logo")}
                            className="hidden"
                          />
                        </label>
                        {uploadingField === "experience_logo" && <i className="fa-solid fa-spinner fa-spin text-[#00adb5]"></i>}
                        {newExp.logo_url && <span className="text-[9px] text-green-400 font-bold max-w-[200px] truncate"><i className="fa-solid fa-circle-check"></i> Pronta!</span>}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#00adb5] to-[#00989f] text-white font-bold text-xs rounded-xl hover:from-[#00c2cb] hover:to-[#00a6ad] transition cursor-pointer self-start"
                  >
                    Adicionar Empresa
                  </button>
                </form>
              </div>

              {/* Listed logos */}
              <div className="flex flex-col gap-4">
                <div className="border-b border-white/[0.04] pb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empresas Cadastradas ({experiences.length})</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {experiences.map((exp) => (
                    <div 
                      key={exp.id} 
                      className="p-4 rounded-xl flex items-center justify-between gap-4 transition duration-300 hover:bg-white/[0.01]"
                      style={{
                        background: "rgba(17, 24, 39, 0.35)",
                        border: "1px solid rgba(255, 255, 255, 0.04)"
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: "rgba(10,15,23,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          {exp.logo_url ? (
                            <img src={exp.logo_url} alt={exp.company_name} className="max-w-[70%] max-h-[70%] object-contain" />
                          ) : (
                            <span className="text-[10px] font-black text-[#00adb5]">{exp.company_name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-white truncate">{exp.company_name}</h4>
                          <p className="text-[9px] text-slate-500 mt-0.5 truncate">{exp.logo_url ? "Imagem Carregada" : `Fallback: ${exp.logo_text}`}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] text-[#f87171] font-bold hover:bg-red-500/15 cursor-pointer transition shrink-0"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>

                {experiences.length === 0 && (
                  <div className="text-center py-16 text-slate-500 text-xs italic border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    Nenhuma empresa adicionada ao marquete.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CONNECTIONS (SOCIAL NETWORKS) */}
          {activeTab === "socials" && (
            <div className="flex flex-col gap-6 animate-[fadeInUp_0.4s_ease-out]">
              <div>
                <h2 className="text-xl font-black tracking-tight">Conexões & Redes</h2>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Adicione e edite os parâmetros identificadores. O sistema gera os links finais automaticamente de forma segura.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {socials.map((social) => (
                  <form 
                    key={social.id} 
                    onSubmit={(e) => handleSocialSubmit(e, social)} 
                    className="p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition duration-300 hover:bg-white/[0.01]"
                    style={{
                      background: "rgba(17, 24, 39, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.04)"
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-[220px]">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-300 hover:scale-105"
                        style={{ 
                          background: "rgba(10, 15, 23, 0.6)", 
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          color: social.brandColor 
                        }}
                      >
                        <i className={social.icon}></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{social.platform}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">{social.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-5">
                      {/* Param input */}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                          {social.platform === "WhatsApp" && "Número (DDD + Número, ex: +5512997741275)"}
                          {social.platform === "E-mail" && "E-mail Oficial"}
                          {social.platform === "GitHub" && "Username do GitHub"}
                          {social.platform === "LinkedIn" && "Username do LinkedIn"}
                          {social.platform === "Instagram" && "Username (@ do Instagram)"}
                        </label>
                        <input 
                          type="text" required
                          value={social.param_value}
                          onChange={(e) => handleSocialChange(social.id, "param_value", e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#0B0F17]/60 border border-white/5 outline-none focus:border-[#00adb5]/30 text-slate-200"
                        />
                      </div>

                      {/* Visibility Toggle Switch */}
                      <div className="flex items-center gap-2 self-end md:self-center pb-1 md:pb-0">
                        <input 
                          type="checkbox" 
                          id={`visible-${social.id}`}
                          checked={social.is_visible}
                          onChange={(e) => handleSocialChange(social.id, "is_visible", e.target.checked)}
                          className="w-4 h-4 accent-[#00adb5] cursor-pointer"
                        />
                        <label htmlFor={`visible-${social.id}`} className="text-xs text-slate-400 cursor-pointer font-bold select-none">
                          Visível
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="px-4 py-2.5 bg-gradient-to-r from-[#00adb5] to-[#00989f] text-white font-bold text-xs rounded-xl hover:from-[#00c2cb] hover:to-[#00a6ad] transition cursor-pointer self-end md:self-center hover:scale-[1.02]"
                    >
                      Salvar
                    </button>
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
