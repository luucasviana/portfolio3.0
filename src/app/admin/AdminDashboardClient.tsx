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
  };

  // --------------------------------------------------------------------------
  // RENDER: UNINITIALIZED DATABASE PORTAL
  // --------------------------------------------------------------------------
  if (!isDbInitialized) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center p-6 text-center"
        style={{ backgroundColor: "#12151a", color: "#eeeeee", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div 
          className="max-w-[480px] w-full p-8 rounded-3xl relative overflow-hidden"
          style={{
            background: "rgba(45, 52, 63, 0.65)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.4)"
          }}
        >
          <div 
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-6"
            style={{ background: "rgba(0, 173, 181, 0.1)", color: "#00adb5" }}
          >
            <i className="fa-solid fa-database"></i>
          </div>
          
          <h1 className="text-2xl font-extrabold mb-3">Bem-vindo ao seu Portfólio!</h1>
          
          <p className="text-sm font-light text-slate-300 mb-8 leading-relaxed">
            Parabéns! Sua aplicação Next.js foi conectada com sucesso ao banco da Vercel. 
            Clique no botão abaixo para estruturar suas tabelas e semear o conteúdo padrão personalizado.
          </p>

          {dbMessage && (
            <div className="text-xs mb-6 text-[#00adb5] font-semibold animate-pulse">
              {dbMessage}
            </div>
          )}

          <button
            onClick={handleDbInitialize}
            disabled={dbLoading}
            className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              background: dbLoading ? "rgba(0, 173, 181, 0.5)" : "#00adb5",
              color: "#ffffff",
              boxShadow: "0 4px 15px rgba(0, 173, 181, 0.25)"
            }}
          >
            {dbLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Criando Estrutura...
              </>
            ) : (
              <>
                Inicializar Banco de Dados <i className="fa-solid fa-bolt"></i>
              </>
            )}
          </button>
          
          <div className="mt-8 text-xs text-slate-500 font-light flex items-center justify-center gap-4">
            <span>Next.js 16</span>
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
        color: "#eeeeee",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Toast Alert */}
      {statusMsg.text && (
        <div 
          className="fixed top-6 right-6 px-6 py-3 rounded-2xl z-50 shadow-2xl flex items-center gap-2 text-sm font-semibold transition-all duration-300 animate-bounce"
          style={{
            background: statusMsg.type === "error" ? "rgba(234, 67, 53, 0.95)" : "rgba(0, 173, 181, 0.95)",
            border: `1px solid ${statusMsg.type === "error" ? "#ea4335" : "#00adb5"}`,
            color: "#ffffff"
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
          background: "rgba(45, 52, 63, 0.35)", 
          backdropFilter: "blur(12px)", 
          borderColor: "rgba(255, 255, 255, 0.05)" 
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight" style={{ color: "#eeeeee" }}>
            LV<span style={{ color: "#00adb5" }}>.</span>
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider" style={{ background: "rgba(0, 173, 181, 0.1)", color: "#00adb5" }}>
            Admin Console
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <a 
            href="/" 
            className="text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5 border border-white/5"
            style={{ color: "#b2bec3", textDecoration: "none" }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square mr-1"></i> Ver Site
          </a>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:bg-red-500/10 border border-red-500/10 cursor-pointer"
            style={{ color: "#ea4335" }}
          >
            Sair <i className="fa-solid fa-right-from-bracket ml-1"></i>
          </button>
        </div>
      </header>

      {/* Dashboard Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Side Tab Navigation Menu */}
        <aside 
          className="w-full md:w-[240px] p-6 border-r flex flex-col gap-2"
          style={{ borderColor: "rgba(255, 255, 255, 0.05)", background: "rgba(45, 52, 63, 0.15)" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2 block">
            Editor de Conteúdo
          </span>

          <button
            onClick={() => { setActiveTab("profile"); setEditingProject(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-3 cursor-pointer ${
              activeTab === "profile" 
                ? "bg-[#00adb5] text-white shadow-lg shadow-[#00adb5]/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="fa-solid fa-user-gear"></i> Perfil & Trajetória
          </button>

          <button
            onClick={() => { setActiveTab("projects"); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-3 cursor-pointer ${
              activeTab === "projects" 
                ? "bg-[#00adb5] text-white shadow-lg shadow-[#00adb5]/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="fa-solid fa-briefcase"></i> Projetos
          </button>

          <button
            onClick={() => { setActiveTab("experience"); setEditingProject(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-3 cursor-pointer ${
              activeTab === "experience" 
                ? "bg-[#00adb5] text-white shadow-lg shadow-[#00adb5]/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="fa-solid fa-layer-group"></i> Empresas & Logos
          </button>

          <button
            onClick={() => { setActiveTab("socials"); setEditingProject(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-3 cursor-pointer ${
              activeTab === "socials" 
                ? "bg-[#00adb5] text-white shadow-lg shadow-[#00adb5]/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="fa-solid fa-paper-plane"></i> Conexões & Redes
          </button>
        </aside>

        {/* Right Side Content Panel */}
        <main className="flex-1 p-8 md:p-10 overflow-y-auto max-w-[960px]">
          
          {/* TAB: PROFILE (Hero & Sobre) */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 animate-[fadeInUp_0.4s_ease]">
              <div className="mb-4">
                <h2 className="text-xl font-extrabold">Perfil & Trajetória</h2>
                <p className="text-xs font-light text-slate-400 mt-1">Configure o cabeçalho inicial e o texto explicativo da sua carreira.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#00adb5] uppercase">Nome de Exibição</label>
                    <input 
                      type="text" 
                      required
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm bg-black/10 border border-white/5 outline-none focus:border-[#00adb5] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#00adb5] uppercase">Subtítulo (Tagline)</label>
                    <input 
                      type="text" 
                      required
                      value={profile.subtitle}
                      onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm bg-black/10 border border-white/5 outline-none focus:border-[#00adb5] transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#00adb5] uppercase">Descrição Principal (Hero)</label>
                  <textarea 
                    rows={3}
                    required
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-black/10 border border-white/5 outline-none focus:border-[#00adb5] transition-all resize-none"
                  />
                </div>

                <div className="border-t border-white/5 pt-4 my-2">
                  <h3 className="text-sm font-bold text-slate-300 mb-4">Texto da Trajetória (Seção Sobre Mim)</h3>
                  
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Parágrafo 1</label>
                      <textarea 
                        rows={3}
                        required
                        value={profile.bio_p1}
                        onChange={(e) => setProfile({ ...profile, bio_p1: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm bg-black/10 border border-white/5 outline-none focus:border-[#00adb5] transition-all resize-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Parágrafo 2</label>
                      <textarea 
                        rows={3}
                        required
                        value={profile.bio_p2}
                        onChange={(e) => setProfile({ ...profile, bio_p2: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm bg-black/10 border border-white/5 outline-none focus:border-[#00adb5] transition-all resize-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Parágrafo 3</label>
                      <textarea 
                        rows={3}
                        required
                        value={profile.bio_p3}
                        onChange={(e) => setProfile({ ...profile, bio_p3: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm bg-black/10 border border-white/5 outline-none focus:border-[#00adb5] transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 my-2">
                  <h3 className="text-sm font-bold text-slate-300 mb-4">Upload de Anexos (Vercel Blob)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CV PDF Upload */}
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-black/10 border border-white/5">
                      <label className="text-xs font-bold text-[#00adb5] uppercase">PDF de Currículo (CV)</label>
                      <input 
                        type="text" 
                        placeholder="Nenhum arquivo enviado"
                        value={profile.cv_url}
                        readOnly
                        className="w-full px-3 py-2 rounded-lg text-xs bg-black/20 border border-white/5 text-slate-400 outline-none mb-2"
                      />
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, "cv")}
                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10 file:cursor-pointer"
                      />
                      {uploadingField === "cv" && <span className="text-[10px] text-[#00adb5] animate-pulse">Enviando PDF...</span>}
                    </div>

                    {/* Bubble Certificate PDF Upload */}
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-black/10 border border-white/5">
                      <label className="text-xs font-bold text-[#00adb5] uppercase">PDF do Certificado Bubble</label>
                      <input 
                        type="text" 
                        placeholder="Nenhum arquivo enviado"
                        value={profile.certificate_bubble_url}
                        readOnly
                        className="w-full px-3 py-2 rounded-lg text-xs bg-black/20 border border-white/5 text-slate-400 outline-none mb-2"
                      />
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, "certificate")}
                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10 file:cursor-pointer"
                      />
                      {uploadingField === "certificate" && <span className="text-[10px] text-[#00adb5] animate-pulse">Enviando PDF...</span>}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="px-6 py-3.5 bg-[#00adb5] text-white font-bold rounded-xl text-sm transition hover:bg-[#00c2cb] shadow-lg shadow-[#00adb5]/20 cursor-pointer self-start"
                >
                  Salvar Alterações de Perfil <i className="fa-solid fa-circle-check ml-1"></i>
                </button>
              </form>
            </div>
          )}

          {/* TAB: PROJECTS (CRUD) */}
          {activeTab === "projects" && (
            <div className="flex flex-col gap-6 animate-[fadeInUp_0.4s_ease]">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-xl font-extrabold">Gestão de Projetos</h2>
                  <p className="text-xs font-light text-slate-400 mt-1">Gerencie a trindade de projetos em destaque do seu portfólio.</p>
                </div>
                {!editingProject && (
                  <button 
                    onClick={handleNewProjectClick}
                    className="px-4 py-2.5 bg-[#00adb5] text-white font-bold text-xs rounded-xl transition hover:bg-[#00c2cb] cursor-pointer flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus"></i> Novo Projeto
                  </button>
                )}
              </div>

              {/* Editing or Creating Project Form */}
              {editingProject ? (
                <div className="p-6 rounded-3xl bg-black/10 border border-white/5">
                  <h3 className="text-sm font-bold text-[#00adb5] uppercase mb-6">
                    {editingProject.id ? `Editar: ${editingProject.title}` : "Adicionar Novo Projeto"}
                  </h3>
                  
                  <form onSubmit={handleProjectSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Título do Projeto</label>
                        <input 
                          type="text" required
                          value={editingProject.title}
                          onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                          className="px-3 py-2.5 rounded-lg text-sm bg-black/20 border border-white/5 outline-none focus:border-[#00adb5]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Categoria / Tag de Escopo</label>
                        <input 
                          type="text" required placeholder="ex: SaaS B2B / IA"
                          value={editingProject.category}
                          onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                          className="px-3 py-2.5 rounded-lg text-sm bg-black/20 border border-white/5 outline-none focus:border-[#00adb5]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Descrição do Projeto</label>
                      <textarea 
                        rows={3} required
                        value={editingProject.description}
                        onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                        className="px-3 py-2.5 rounded-lg text-sm bg-black/20 border border-white/5 outline-none focus:border-[#00adb5] resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Tags / Badges de Tecnologia (Separados por vírgula)</label>
                      <input 
                        type="text" required placeholder="ex: React, TypeScript, Supabase, Playwright"
                        value={Array.isArray(editingProject.tags) ? editingProject.tags.join(", ") : editingProject.tags}
                        onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value })}
                        className="px-3 py-2.5 rounded-lg text-sm bg-black/20 border border-white/5 outline-none focus:border-[#00adb5]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-white/5 pt-4 mt-2">
                      {/* Main Action Link */}
                      <div className="flex flex-col gap-3 p-4 rounded-xl bg-black/10">
                        <span className="text-xs font-bold text-[#00adb5]">Link de Ação Principal</span>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400">Texto do Botão (ex: Conhecer o SaaS)</label>
                          <input 
                            type="text" required
                            value={editingProject.link_label}
                            onChange={(e) => setEditingProject({ ...editingProject, link_label: e.target.value })}
                            className="px-3 py-2 rounded-lg text-xs bg-black/20 border border-white/5 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400">URL de Destino</label>
                          <input 
                            type="text" required
                            value={editingProject.link_url}
                            onChange={(e) => setEditingProject({ ...editingProject, link_url: e.target.value })}
                            className="px-3 py-2 rounded-lg text-xs bg-black/20 border border-white/5 outline-none"
                          />
                        </div>
                      </div>

                      {/* Secondary Action Link */}
                      <div className="flex flex-col gap-3 p-4 rounded-xl bg-black/10">
                        <span className="text-xs font-bold text-slate-400">Link de Ação Secundário (GitHub/Figma - Opcional)</span>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400">Texto do Link (ex: Figma ou Código)</label>
                          <input 
                            type="text"
                            value={editingProject.secondary_link_label || ""}
                            onChange={(e) => setEditingProject({ ...editingProject, secondary_link_label: e.target.value })}
                            className="px-3 py-2 rounded-lg text-xs bg-black/20 border border-white/5 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400">URL de Destino</label>
                          <input 
                            type="text"
                            value={editingProject.secondary_link || ""}
                            onChange={(e) => setEditingProject({ ...editingProject, secondary_link: e.target.value })}
                            className="px-3 py-2 rounded-lg text-xs bg-black/20 border border-white/5 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <button 
                        type="submit"
                        className="px-5 py-2.5 bg-[#00adb5] text-white font-bold text-xs rounded-lg hover:bg-[#00c2cb] cursor-pointer"
                      >
                        Salvar Projeto
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingProject(null)}
                        className="px-5 py-2.5 bg-transparent text-slate-400 font-semibold text-xs rounded-lg hover:bg-white/5 border border-white/5 cursor-pointer"
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
                      className="p-5 rounded-2xl bg-black/10 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#00adb5] uppercase tracking-wider">{project.category}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{project.title}</h4>
                        <p className="text-xs text-slate-400 font-light mt-1 line-clamp-1 max-w-[500px]">{project.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingProject(project)}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300 font-bold hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/10 text-xs text-red-500 font-bold hover:bg-red-500/20 cursor-pointer"
                        >
                          <i className="fa-solid fa-trash"></i> Excluir
                        </button>
                      </div>
                    </div>
                  ))}

                  {projects.length === 0 && (
                    <div className="text-center p-12 text-slate-500 text-xs">
                      Nenhum projeto cadastrado no banco.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: EXPERIENCE & LOGOS */}
          {activeTab === "experience" && (
            <div className="flex flex-col gap-6 animate-[fadeInUp_0.4s_ease]">
              <div className="mb-4">
                <h2 className="text-xl font-extrabold">Carrossel de Experiência</h2>
                <p className="text-xs font-light text-slate-400 mt-1">Adicione ou remova as empresas e logos que ficam rolando na seção "Sobre".</p>
              </div>

              {/* Add New Experience Logo Form */}
              <div className="p-6 rounded-2xl bg-black/10 border border-white/5 mb-2">
                <h3 className="text-xs font-bold text-[#00adb5] uppercase mb-4">Adicionar Empresa ao Carrossel</h3>
                
                <form onSubmit={handleExperienceSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 font-semibold">Nome da Empresa</label>
                      <input 
                        type="text" required placeholder="ex: InfoEduc"
                        value={newExp.company_name}
                        onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value, logo_text: e.target.value })}
                        className="px-3 py-2 rounded-lg text-xs bg-black/20 border border-white/5 outline-none"
                      />
                    </div>
                    {/* Optional URL input or dynamic logo image upload */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 font-semibold">Logo da Empresa (Upload Imagem - Opcional)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "experience_logo")}
                          className="text-[10px] text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10 file:cursor-pointer"
                        />
                        {uploadingField === "experience_logo" && <i className="fa-solid fa-spinner fa-spin text-[#00adb5]"></i>}
                      </div>
                      {newExp.logo_url && <span className="text-[9px] text-[#00adb5] font-semibold truncate">Enviado: {newExp.logo_url}</span>}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="px-4 py-2.5 bg-[#00adb5] text-white font-bold text-xs rounded-lg hover:bg-[#00c2cb] cursor-pointer self-start"
                  >
                    Adicionar Empresa
                  </button>
                </form>
              </div>

              {/* Listed logos */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Empresas Cadastradas</h3>
                {experiences.map((exp) => (
                  <div 
                    key={exp.id} 
                    className="p-4 rounded-xl bg-black/10 border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        {exp.logo_url ? (
                          <img src={exp.logo_url} alt={exp.company_name} className="max-w-[80%] max-h-[80%] object-contain" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#00adb5]">Logo</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{exp.company_name}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">Sem imagem (Texto Padrão: {exp.logo_text})</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/10 text-[10px] text-red-500 font-bold hover:bg-red-500/20 cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CONNECTIONS (SOCIAL NETWORKS) */}
          {activeTab === "socials" && (
            <div className="flex flex-col gap-6 animate-[fadeInUp_0.4s_ease]">
              <div className="mb-4">
                <h2 className="text-xl font-extrabold">Conexões & Redes</h2>
                <p className="text-xs font-light text-slate-400 mt-1">
                  Gerencie quais redes estão ativas e insira apenas o parâmetro identificador. O sistema constrói os links finais automaticamente.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                {socials.map((social) => (
                  <form 
                    key={social.id} 
                    onSubmit={(e) => handleSocialSubmit(e, social)} 
                    className="p-5 rounded-2xl bg-black/10 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: "rgba(255,255,255,0.03)", color: social.brandColor }}
                      >
                        <i className={social.icon}></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{social.platform}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">{social.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                      {/* Param input */}
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-semibold uppercase">
                          {social.platform === "WhatsApp" && "Número (Com DDD, ex: +5512997741275)"}
                          {social.platform === "E-mail" && "Endereço de E-mail"}
                          {social.platform === "GitHub" && "Username do GitHub"}
                          {social.platform === "LinkedIn" && "Username do LinkedIn"}
                          {social.platform === "Instagram" && "Username (@ do Instagram)"}
                        </label>
                        <input 
                          type="text" required
                          value={social.param_value}
                          onChange={(e) => handleSocialChange(social.id, "param_value", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-black/25 border border-white/5 outline-none focus:border-[#00adb5]"
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
                        <label htmlFor={`visible-${social.id}`} className="text-xs text-slate-400 cursor-pointer font-medium select-none">
                          Visível
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="px-4 py-2.5 bg-[#00adb5] text-white font-bold text-xs rounded-xl hover:bg-[#00c2cb] cursor-pointer self-end md:self-center"
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
