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
        // Force refresh and redirect to /admin
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
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        backgroundColor: "#12151a",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Subtle dynamic background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0, 173, 181, 0.05) 0%, transparent 70%)",
          zIndex: 0
        }}
      ></div>

      <div 
        className="w-full max-w-[420px] rounded-3xl p-8 relative z-10 transition-all duration-300"
        style={{
          background: "rgba(45, 52, 63, 0.65)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "0 15px 40px rgba(0, 0, 0, 0.4)"
        }}
      >
        <div className="text-center mb-8">
          <h1 
            className="text-2xl font-extrabold tracking-tight mb-2"
            style={{ color: "#eeeeee" }}
          >
            Painel Administrativo
          </h1>
          <p 
            className="text-xs font-light"
            style={{ color: "#b2bec3" }}
          >
            Acesso restrito ao proprietário do portfólio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label 
              htmlFor="password" 
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: "#00adb5" }}
            >
              Senha de Acesso
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha mestra..."
              className="w-full px-4 py-3 rounded-xl transition-all duration-300 text-sm"
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#eeeeee",
                outline: "none"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#00adb5";
                e.target.style.boxShadow = "0 0 10px rgba(0, 173, 181, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <div 
              className="text-xs py-2 px-3 rounded-lg text-center"
              style={{ 
                background: "rgba(234, 67, 53, 0.1)", 
                border: "1px solid rgba(234, 67, 53, 0.2)", 
                color: "#ea4335" 
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mt-2"
            style={{
              background: loading ? "rgba(0, 173, 181, 0.5)" : "#00adb5",
              color: "#ffffff",
              border: "none",
              boxShadow: "0 4px 15px rgba(0, 173, 181, 0.25)"
            }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Autenticando...
              </>
            ) : (
              <>
                Entrar <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <a 
            href="/" 
            className="text-xs transition-all duration-300 hover:opacity-80"
            style={{ color: "#b2bec3", textDecoration: "none" }}
          >
            <i className="fa-solid fa-chevron-left mr-1"></i> Voltar ao site principal
          </a>
        </div>
      </div>
    </div>
  );
}
