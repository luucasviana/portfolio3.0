"use client";

import React, { useState } from "react";
import { loginAction } from "../actions";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginAction(password);
      if (res.success) {
        window.location.href = "/admin";
      } else {
        setError(res.error || "Senha inválida.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro no servidor. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden select-none"
      style={{
        backgroundColor: "#12151a",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Subtle Dynamic Background Mesh */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none rounded-full blur-[140px]"
        style={{
          background: "radial-gradient(circle, rgba(0, 173, 181, 0.05) 0%, transparent 70%)",
          zIndex: 0
        }}
      ></div>

      {/* Premium shadcn/ui Card Container */}
      <div 
        className="w-full max-w-[380px] rounded-2xl p-6 md:p-8 relative z-10 border transition-all duration-300 bg-[#161a22]/90 backdrop-blur-md"
        style={{
          borderColor: "#222c3f",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7)"
        }}
      >
        {/* Sleek Brand Shield Icon */}
        <div className="flex justify-center mb-5">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-transform duration-300 hover:scale-105"
            style={{ 
              background: "rgba(0, 173, 181, 0.08)",
              border: "1px solid rgba(0, 173, 181, 0.25)",
              color: "#00adb5",
              boxShadow: "0 0 20px rgba(0, 173, 181, 0.1)"
            }}
          >
            <i className="fa-solid fa-shield-halved text-base"></i>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-center mb-6">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Console Administrativo
          </h1>
          <p className="text-xs text-slate-300 font-light leading-relaxed">
            Insira sua chave mestra para gerenciar o portfólio.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label 
              htmlFor="password" 
              className="text-[11px] font-bold uppercase tracking-wider text-slate-300"
            >
              Senha de Acesso
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-sm">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg transition-all duration-200 text-sm placeholder-slate-500 bg-[#0f1218] border border-[#222c3f] text-white outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5] hover:border-slate-700"
              />
            </div>
          </div>

          {error && (
            <div 
              className="text-[12px] py-2 px-3 rounded-lg text-center flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold"
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-extrabold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-[0_4px_12px_rgba(0,173,181,0.15)] hover:shadow-[0_4px_20px_rgba(0,173,181,0.3)] hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: "#00adb5",
              color: "#12151a",
              border: "none",
            }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-[#12151a]"></i> Autenticando...
              </>
            ) : (
              <>
                Entrar no Painel <i className="fa-solid fa-arrow-right-to-bracket text-xs ml-0.5"></i>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-[#222c3f]">
          <a 
            href="/" 
            className="text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-200 text-slate-300 hover:text-[#00adb5]"
            style={{ textDecoration: "none" }}
          >
            <i className="fa-solid fa-chevron-left text-[10px]"></i> Voltar ao site principal
          </a>
        </div>
      </div>
    </div>
  );
}

