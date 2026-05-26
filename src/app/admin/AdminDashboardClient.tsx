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
        backgroundColor: "#12151a",
        color: "#f8fafc",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Toast Alert */}
      {statusMsg.text && (
        <div 
          className="fixed top-6 right-6 px-4 py-3 rounded-lg z-50 shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
          style={{
            background: statusMsg.type === "error" ? "rgba(239, 68, 68, 0.95)" : "rgba(0, 173, 181, 0.95)",
            border: `1px solid ${statusMsg.type === "error" ? "#ef4444" : "#00adb5"}`,
            color: statusMsg.type === "error" ? "#ffffff" : "#12151a",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}
        >
          <i className={statusMsg.type === "error" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-check"}></i>
          {statusMsg.text}
        </div>
      )}

      {/* Main Admin Navbar */}
      <header 
        className="w-full px-6 py-4 flex items-center justify-between border-b"
        style={{ 
          background: "#161a22", 
          borderColor: "#222c3f" 
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-white select-none">
            LV<span style={{ color: "#00adb5" }}>.</span>
          </span>
          <span className="text-[10px] px-2.5 py-1 rounded-md font-bold tracking-wider border select-none transition-all duration-300" style={{ background: "rgba(0, 173, 181, 0.08)", color: "#00adb5", borderColor: "rgba(0, 173, 181, 0.2)" }}>
            Admin Console
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href="/" 
            className="text-xs font-bold px-3.5 py-2 rounded-lg transition-all duration-200 bg-[#0f1218] hover:bg-[#1c212c] border border-[#222c3f] flex items-center gap-1.5 text-slate-200"
            style={{ textDecoration: "none" }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Ver Site
          </a>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold px-3.5 py-2 rounded-lg transition-all duration-200 bg-rose-500/10 hover:bg-[#ffe4e6]/10 border border-rose-500/20 cursor-pointer flex items-center gap-1.5 text-rose-400"
          >
            Sair <i className="fa-solid fa-right-from-bracket text-[10px]"></i>
          </button>
        </div>
      </header>

      {/* Dashboard Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Side Tab Navigation Menu */}
        <aside 
          className="w-full md:w-[240px] p-6 border-r flex flex-col gap-2 shrink-0"
          style={{ borderColor: "#222c3f", background: "#161a22" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2 block select-none">
            Editor de Conteúdo
          </span>

          <button
            onClick={() => { setActiveTab("profile"); setEditingProject(null); }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-3 cursor-pointer border ${
              activeTab === "profile" 
                ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/20 font-bold shadow-sm" 
                : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200"
            }`}
          >
            <i className="fa-solid fa-user-gear text-sm"></i> Perfil & Trajetória
          </button>

          <button
            onClick={() => { setActiveTab("projects"); }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-3 cursor-pointer border ${
              activeTab === "projects" 
                ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/20 font-bold shadow-sm" 
                : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200"
            }`}
          >
            <i className="fa-solid fa-briefcase text-sm"></i> Projetos
          </button>

          <button
            onClick={() => { setActiveTab("experience"); setEditingProject(null); }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-3 cursor-pointer border ${
              activeTab === "experience" 
                ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/20 font-bold shadow-sm" 
                : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200"
            }`}
          >
            <i className="fa-solid fa-layer-group text-sm"></i> Empresas & Logos
          </button>

          <button
            onClick={() => { setActiveTab("socials"); setEditingProject(null); }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-3 cursor-pointer border ${
              activeTab === "socials" 
                ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/20 font-bold shadow-sm" 
                : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200"
            }`}
          >
            <i className="fa-solid fa-paper-plane text-sm"></i> Conexões & Redes
          </button>
        </aside>

        {/* Right Side Content Panel */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-[850px] w-full flex flex-col gap-8">
          
          {/* TAB: PROFILE (Hero & Sobre) */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
              <div className="mb-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-white">Perfil & Trajetória</h2>
                <p className="text-sm text-slate-300 mt-1">Configure as informações da sua página inicial e os parágrafos da seção Sobre Mim.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
                
                {/* Módulo: Apresentação Principal */}
                <div 
                  className="rounded-2xl border p-6 flex flex-col gap-5 bg-[#161a22] border-[#222c3f] shadow-lg"
                >
                  <h3 className="text-xs font-black uppercase text-[#00adb5] tracking-wider mb-1">Apresentação Principal</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wide">Nome de Exibição</label>
                      <input 
                        type="text" 
                        required
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wide">Subtítulo (Tagline)</label>
                      <input 
                        type="text" 
                        required
                        value={profile.subtitle}
                        onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300 tracking-wide">Descrição do Hero</label>
                    <textarea 
                      rows={3}
                      required
                      value={profile.description}
                      onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                      className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Módulo: Trajetória */}
                <div 
                  className="rounded-2xl border p-6 flex flex-col gap-5 bg-[#161a22] border-[#222c3f] shadow-lg"
                >
                  <h3 className="text-xs font-black uppercase text-[#00adb5] tracking-wider mb-1">Sobre Mim (Biografia)</h3>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wide">Primeiro Parágrafo</label>
                      <textarea 
                        rows={3}
                        required
                        value={profile.bio_p1}
                        onChange={(e) => setProfile({ ...profile, bio_p1: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700 resize-none leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wide">Segundo Parágrafo</label>
                      <textarea 
                        rows={3}
                        required
                        value={profile.bio_p2}
                        onChange={(e) => setProfile({ ...profile, bio_p2: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700 resize-none leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wide">Terceiro Parágrafo</label>
                      <textarea 
                        rows={3}
                        required
                        value={profile.bio_p3}
                        onChange={(e) => setProfile({ ...profile, bio_p3: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Módulo: Documentos */}
                <div 
                  className="rounded-2xl border p-6 flex flex-col gap-5 bg-[#161a22] border-[#222c3f] shadow-lg"
                >
                  <h3 className="text-xs font-black uppercase text-[#00adb5] tracking-wider mb-1">Anexos (Vercel Blob)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* CV PDF Upload */}
                    <div className="flex flex-col gap-3 p-5 rounded-xl bg-[#0f1218]/50 border border-[#222c3f]">
                      <span className="text-[12px] font-bold text-slate-200 tracking-wide">PDF de Currículo (CV)</span>
                      
                      {profile.cv_url ? (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-1 transition duration-200">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 select-none">
                            <i className="fa-solid fa-circle-check"></i> Currículo Ativo
                          </span>
                          <a 
                            href={profile.cv_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-slate-300 hover:text-white underline font-semibold transition duration-200"
                          >
                            Visualizar PDF
                          </a>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic mb-1 px-1 select-none">Nenhum arquivo enviado ainda</div>
                      )}

                      <label className="relative flex flex-col items-center justify-center p-5 border border-dashed border-[#222c3f] hover:border-[#00adb5]/40 hover:bg-[#0f1218]/80 rounded-xl bg-[#0f1218] cursor-pointer transition-all duration-200 group">
                        <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-400 group-hover:text-[#00adb5] mb-2 transition-colors"></i>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Fazer Upload de Novo PDF</span>
                        <span className="text-[10px] text-slate-500 mt-1 select-none">Selecione arquivos .pdf de até 5MB</span>
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => handleFileUpload(e, "cv")}
                          className="hidden"
                        />
                      </label>
                      
                      {uploadingField === "cv" && (
                        <div className="flex items-center gap-2 text-xs text-[#00adb5] font-semibold animate-pulse select-none mt-1">
                          <i className="fa-solid fa-spinner fa-spin"></i> Enviando para o Vercel Blob...
                        </div>
                      )}
                    </div>

                    {/* Bubble Certificate PDF Upload */}
                    <div className="flex flex-col gap-3 p-5 rounded-xl bg-[#0f1218]/50 border border-[#222c3f]">
                      <span className="text-[12px] font-bold text-slate-200 tracking-wide">PDF do Certificado Bubble</span>
                      
                      {profile.certificate_bubble_url ? (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-1 transition duration-200">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 select-none">
                            <i className="fa-solid fa-circle-check"></i> Certificado Ativo
                          </span>
                          <a 
                            href={profile.certificate_bubble_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-slate-300 hover:text-white underline font-semibold transition duration-200"
                          >
                            Visualizar PDF
                          </a>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic mb-1 px-1 select-none">Nenhum arquivo enviado ainda</div>
                      )}

                      <label className="relative flex flex-col items-center justify-center p-5 border border-dashed border-[#222c3f] hover:border-[#00adb5]/40 hover:bg-[#0f1218]/80 rounded-xl bg-[#0f1218] cursor-pointer transition-all duration-200 group">
                        <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-400 group-hover:text-[#00adb5] mb-2 transition-colors"></i>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Fazer Upload de Novo PDF</span>
                        <span className="text-[10px] text-slate-500 mt-1 select-none">Selecione arquivos .pdf de até 5MB</span>
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => handleFileUpload(e, "certificate")}
                          className="hidden"
                        />
                      </label>

                      {uploadingField === "certificate" && (
                        <div className="flex items-center gap-2 text-xs text-[#00adb5] font-semibold animate-pulse select-none mt-1">
                          <i className="fa-solid fa-spinner fa-spin"></i> Enviando para o Vercel Blob...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="py-2.5 px-5 font-extrabold rounded-lg text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_4px_12px_rgba(0,173,181,0.15)] hover:shadow-[0_4px_20px_rgba(0,173,181,0.25)] flex items-center justify-center gap-2 self-start"
                  style={{
                    background: "#00adb5",
                    color: "#12151a"
                  }}
                >
                  Salvar Alterações <i className="fa-solid fa-check ml-0.5 text-xs"></i>
                </button>
              </form>
            </div>
          )}

          {/* TAB: PROJECTS (CRUD) */}
          {activeTab === "projects" && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">Projetos</h2>
                  <p className="text-sm text-slate-300 mt-1">Crie e edite os cards de projetos mostrados na grade de destaques.</p>
                </div>
                {!editingProject && (
                  <button 
                    onClick={handleNewProjectClick}
                    className="px-4 py-2.5 rounded-lg font-extrabold text-xs transition duration-200 cursor-pointer flex items-center gap-2 hover:scale-[1.01] shadow-[0_4px_10px_rgba(0,173,181,0.15)] shrink-0"
                    style={{
                      background: "#00adb5",
                      color: "#12151a"
                    }}
                  >
                    <i className="fa-solid fa-plus text-[10px]"></i> Adicionar Projeto
                  </button>
                )}
              </div>

              {/* Form de Adicionar/Editar Projeto */}
              {editingProject ? (
                <div 
                  className="rounded-2xl border p-6 flex flex-col gap-5 animate-[fadeIn_0.2s_ease-out] bg-[#161a22] border-[#222c3f]"
                >
                  <h3 className="text-xs font-black uppercase text-[#00adb5] tracking-wider mb-2 border-b border-[#222c3f] pb-2">
                    {editingProject.id ? `Editar: ${editingProject.title}` : "Novo Projeto"}
                  </h3>
                  
                  <form onSubmit={handleProjectSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-300 tracking-wide">Título do Projeto</label>
                        <input 
                          type="text" required
                          value={editingProject.title}
                          onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                          className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-300 tracking-wide">Categoria / Escopo</label>
                        <input 
                          type="text" required placeholder="ex: SaaS B2B / IA"
                          value={editingProject.category}
                          onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                          className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wide">Descrição Detalhada</label>
                      <textarea 
                        rows={4} required
                        value={editingProject.description}
                        onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wide">Badges de Tecnologia (Separados por vírgula)</label>
                      <input 
                        type="text" required placeholder="ex: React, TypeScript, Supabase"
                        value={Array.isArray(editingProject.tags) ? editingProject.tags.join(", ") : editingProject.tags}
                        onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-[#222c3f] pt-5 mt-2">
                      {/* Link de Ação Principal */}
                      <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#0f1218]/50 border border-[#222c3f]">
                        <span className="text-[12px] font-bold text-slate-200 border-b border-[#222c3f] pb-1.5 block tracking-wide">Ação Principal</span>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Texto do Botão (ex: Conhecer o SaaS)</label>
                          <input 
                            type="text" required
                            value={editingProject.link_label}
                            onChange={(e) => setEditingProject({ ...editingProject, link_label: e.target.value })}
                            className="w-full py-2.5 px-3 rounded-lg text-xs bg-[#0f1218] border border-[#222c3f] text-white outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Link URL / Destino</label>
                          <input 
                            type="text" required
                            value={editingProject.link_url}
                            onChange={(e) => setEditingProject({ ...editingProject, link_url: e.target.value })}
                            className="w-full py-2.5 px-3 rounded-lg text-xs bg-[#0f1218] border border-[#222c3f] text-white outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]"
                          />
                        </div>
                      </div>

                      {/* Link de Ação Secundário */}
                      <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#0f1218]/50 border border-[#222c3f]">
                        <span className="text-[12px] font-bold text-slate-200 border-b border-[#222c3f] pb-1.5 block tracking-wide">Ação Secundária (Opcional)</span>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Texto do Botão (ex: Figma / Código)</label>
                          <input 
                            type="text"
                            value={editingProject.secondary_link_label || ""}
                            onChange={(e) => setEditingProject({ ...editingProject, secondary_link_label: e.target.value })}
                            className="w-full py-2.5 px-3 rounded-lg text-xs bg-[#0f1218] border border-[#222c3f] text-white outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Link URL / Destino</label>
                          <input 
                            type="text"
                            value={editingProject.secondary_link || ""}
                            onChange={(e) => setEditingProject({ ...editingProject, secondary_link: e.target.value })}
                            className="w-full py-2.5 px-3 rounded-lg text-xs bg-[#0f1218] border border-[#222c3f] text-white outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <button 
                        type="submit"
                        className="py-2.5 px-5 font-extrabold rounded-lg text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_4px_12px_rgba(0,173,181,0.15)] flex items-center justify-center gap-2"
                        style={{
                          background: "#00adb5",
                          color: "#12151a",
                          border: "none"
                        }}
                      >
                        Salvar Projeto <i className="fa-solid fa-check ml-0.5 text-xs"></i>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingProject(null)}
                        className="py-2.5 px-5 bg-transparent text-slate-300 font-semibold text-sm rounded-lg hover:bg-slate-800 border border-[#222c3f] transition duration-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Grade de Projetos */
                <div className="flex flex-col gap-4">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border transition-all duration-200 hover:bg-[#1c212c] bg-[#161a22]/70"
                      style={{
                        borderColor: "#222c3f"
                      }}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="text-[10px] font-bold text-[#00adb5] uppercase tracking-wider block mb-1.5">{project.category}</span>
                        <h4 className="text-base font-bold text-white">{project.title}</h4>
                        <p className="text-xs text-slate-300 mt-1.5 line-clamp-1 leading-relaxed">{project.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(Array.isArray(project.tags) ? project.tags : []).map((tag: string, i: number) => (
                            <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-[#0f1218] border border-[#222c3f] text-slate-200 rounded-md select-none">{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button 
                          onClick={() => setEditingProject(project)}
                          className="px-3.5 py-2 rounded-lg bg-[#0f1218] border border-[#222c3f] text-xs text-slate-200 font-bold hover:bg-slate-800 hover:text-white cursor-pointer transition flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-pen-to-square text-[11px] text-[#00adb5]"></i> Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-bold hover:bg-rose-500/20 cursor-pointer transition flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-trash text-[11px]"></i> Excluir
                        </button>
                      </div>
                    </div>
                  ))}

                  {projects.length === 0 && (
                    <div className="text-center py-16 text-slate-400 text-xs italic border border-dashed border-[#222c3f] rounded-2xl bg-slate-800/10">
                      Nenhum projeto cadastrado no banco.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: EXPERIENCE & LOGOS */}
          {activeTab === "experience" && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white">Experiência & Logos</h2>
                <p className="text-sm text-slate-300 mt-1">Configure as empresas e os nomes textuais das marcas que ficam rolando no carrossel infinito.</p>
              </div>

              {/* Form de Adicionar Empresa */}
              <div 
                className="rounded-2xl border p-6 flex flex-col gap-5 bg-[#161a22] border-[#222c3f]"
              >
                <h3 className="text-xs font-black uppercase text-[#00adb5] tracking-wider mb-2 border-b border-[#222c3f] pb-2">Adicionar Empresa ao Carrossel</h3>
                
                <form onSubmit={handleExperienceSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wide">Nome da Empresa</label>
                      <input 
                        type="text" required placeholder="ex: InfoEduc"
                        value={newExp.company_name}
                        onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value, logo_text: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-white placeholder-slate-500 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 tracking-wide">Logo (Upload de Imagem - Opcional)</label>
                      <div className="flex items-center gap-3">
                        <label className="relative px-3.5 py-2.5 border border-dashed border-[#222c3f] hover:border-[#00adb5]/40 hover:bg-[#0f1218]/80 rounded-xl bg-[#0f1218] cursor-pointer text-xs font-extrabold text-slate-300 transition duration-200 select-none">
                          <i className="fa-solid fa-image mr-1"></i> Escolher Imagem
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "experience_logo")}
                            className="hidden"
                          />
                        </label>
                        {uploadingField === "experience_logo" && <i className="fa-solid fa-spinner fa-spin text-[#00adb5]"></i>}
                        {newExp.logo_url && <span className="text-xs text-emerald-400 font-extrabold max-w-[200px] truncate select-none"><i className="fa-solid fa-circle-check"></i> Pronta!</span>}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="py-2.5 px-5 font-extrabold rounded-lg text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_4px_12px_rgba(0,173,181,0.15)] self-start"
                    style={{
                      background: "#00adb5",
                      color: "#12151a",
                      border: "none"
                    }}
                  >
                    Adicionar Empresa <i className="fa-solid fa-plus text-xs ml-0.5"></i>
                  </button>
                </form>
              </div>

              {/* Lista de Empresas Cadastradas */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2 border-b border-[#222c3f] pb-2">Empresas Cadastradas ({experiences.length})</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {experiences.map((exp) => (
                    <div 
                      key={exp.id} 
                      className="p-4 rounded-xl flex items-center justify-between gap-4 border bg-[#161a22]/70 hover:bg-[#1c212c]/80 transition duration-200"
                      style={{
                        borderColor: "#222c3f"
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-[#0f1218] border border-[#222c3f] select-none"
                        >
                          {exp.logo_url ? (
                            <img src={exp.logo_url} alt={exp.company_name} className="max-w-[70%] max-h-[70%] object-contain" />
                          ) : (
                            <span className="text-[10px] font-black text-[#00adb5]">{exp.company_name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{exp.company_name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{exp.logo_url ? "Imagem ativa" : `Fallback: ${exp.logo_text}`}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-bold hover:bg-rose-500/20 cursor-pointer transition shrink-0"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>

                {experiences.length === 0 && (
                  <div className="text-center py-16 text-slate-400 text-xs italic border border-dashed border-[#222c3f] rounded-2xl bg-slate-800/10">
                    Nenhuma empresa adicionada ao carrossel.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CONNECTIONS (SOCIAL NETWORKS) */}
          {activeTab === "socials" && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white">Conexões & Redes</h2>
                <p className="text-sm text-slate-300 mt-1">
                  Gerencie quais redes de contato estão ativas e configure seus respectivos links diretos de forma simples.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {socials.map((social) => (
                  <form 
                    key={social.id} 
                    onSubmit={(e) => handleSocialSubmit(e, social)} 
                    className="p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border bg-[#161a22]/70 hover:bg-[#1c212c]/40 transition-all duration-200"
                    style={{
                      borderColor: "#222c3f"
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-[200px]">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 bg-[#0f1218] border border-[#222c3f] select-none"
                        style={{ color: social.brandColor }}
                      >
                        <i className={social.icon}></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{social.platform}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{social.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-5">
                      {/* Param input */}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                          {social.platform === "WhatsApp" && "Número (DDD + Número, ex: +5512997741275)"}
                          {social.platform === "E-mail" && "E-mail Oficial"}
                          {social.platform === "GitHub" && "Username do GitHub"}
                          {social.platform === "LinkedIn" && "Username do LinkedIn"}
                          {social.platform === "Instagram" && "Username do Instagram (sem @)"}
                        </label>
                        <input 
                          type="text" required
                          value={social.param_value}
                          onChange={(e) => handleSocialChange(social.id, "param_value", e.target.value)}
                          className="w-full py-2.5 px-3.5 rounded-lg transition-all duration-200 text-sm bg-[#0f1218] border border-[#222c3f] text-slate-100 outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700"
                        />
                      </div>

                      {/* Toggle Switch */}
                      <div className="flex items-center gap-2 self-end md:self-center pb-1 md:pb-0">
                        <input 
                          type="checkbox" 
                          id={`visible-${social.id}`}
                          checked={social.is_visible}
                          onChange={(e) => handleSocialChange(social.id, "is_visible", e.target.checked)}
                          className="w-4 h-4 accent-[#00adb5] cursor-pointer rounded bg-[#0f1218] border-[#222c3f]"
                        />
                        <label htmlFor={`visible-${social.id}`} className="text-xs text-slate-200 cursor-pointer font-bold select-none">
                          Visível
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="px-4 py-2.5 font-extrabold rounded-lg text-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer self-end md:self-center shadow-[0_4px_10px_rgba(0,173,181,0.1)]"
                      style={{
                        background: "#00adb5",
                        color: "#12151a",
                        border: "none"
                      }}
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
