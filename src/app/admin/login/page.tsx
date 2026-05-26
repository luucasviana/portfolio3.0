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
        backgroundColor: "#0B0F17",
        backgroundImage: "radial-gradient(circle at 10% 20%, rgba(0, 173, 181, 0.03) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(162, 155, 254, 0.02) 0%, transparent 40%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Decorative Blur Spheres */}
      <div 
        className="absolute top-1/4 left-1/3 w-[350px] h-[350px] pointer-events-none rounded-full blur-[80px]"
        style={{
          background: "radial-gradient(circle, rgba(0, 173, 181, 0.06) 0%, transparent 80%)",
          zIndex: 0
        }}
      ></div>
      <div 
        className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] pointer-events-none rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, rgba(162, 155, 254, 0.04) 0%, transparent 80%)",
          zIndex: 0
        }}
      ></div>

      <div 
        className="w-full max-w-[440px] rounded-[24px] p-8 md:p-10 relative z-10 transition-all duration-500 animate-[fadeInUp_0.5s_ease-out]"
        style={{
          background: "rgba(17, 24, 39, 0.65)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
        }}
      >
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className="w-12 h-12 rounded-[16px] flex items-center justify-center text-xl transition-transform hover:scale-105 duration-300"
            style={{ 
              background: "linear-gradient(135deg, rgba(0, 173, 181, 0.15), rgba(0, 173, 181, 0.05))",
              border: "1px solid rgba(0, 173, 181, 0.25)",
              color: "#00adb5",
              boxShadow: "0 8px 20px -6px rgba(0, 173, 181, 0.3)"
            }}
          >
            <i className="fa-solid fa-shield-halved"></i>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 
            className="text-2xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-300"
          >
            Console Administrativo
          </h1>
          <p 
            className="text-xs font-medium text-slate-400"
          >
            Insira sua chave mestra para gerenciar o portfólio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-1">
              <label 
                htmlFor="password" 
                className="text-[10px] font-bold tracking-wider uppercase text-slate-400"
              >
                Senha de Acesso
              </label>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-500 text-xs">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-[14px] transition-all duration-300 text-sm placeholder-slate-600"
                style={{
                  background: "rgba(10, 15, 23, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  color: "#eeeeee",
                  outline: "none"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#00adb5";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0, 173, 181, 0.15)";
                  e.target.parentElement!.style.color = "#00adb5";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  e.target.style.boxShadow = "none";
                  e.target.parentElement!.style.color = "inherit";
                }}
              />
            </div>
          </div>

          {error && (
            <div 
              className="text-xs py-3 px-4 rounded-[12px] text-center flex items-center justify-center gap-2 animate-[shake_0.4s_ease-in-out]"
              style={{ 
                background: "rgba(239, 68, 68, 0.06)", 
                border: "1px solid rgba(239, 68, 68, 0.15)", 
                color: "#f87171" 
              }}
            >
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-[14px] font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mt-2 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: loading 
                ? "rgba(0, 173, 181, 0.4)" 
                : "linear-gradient(135deg, #00adb5 0%, #00989f 100%)",
              color: "#ffffff",
              border: "none",
              boxShadow: "0 8px 25px -4px rgba(0, 173, 181, 0.3)"
            }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-white"></i> Verificando credenciais...
              </>
            ) : (
              <>
                Entrar no Painel <i className="fa-solid fa-arrow-right-to-bracket ml-0.5"></i>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8 pt-4 border-t border-white/[0.04]">
          <a 
            href="/" 
            className="text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-300 text-slate-500 hover:text-slate-300 hover:gap-2"
            style={{ textDecoration: "none" }}
          >
            <i className="fa-solid fa-chevron-left"></i> Voltar ao site principal
          </a>
        </div>
      </div>
    </div>
  );
}
