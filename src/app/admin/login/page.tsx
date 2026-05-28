"use client";

import React, { useState, useEffect } from "react";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Lock, Eye, EyeOff, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

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
        triggerShake();
      }
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro no servidor. Tente novamente.");
      setLoading(false);
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#0b0d11] overflow-hidden">
      {/* Background grid */}
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
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,173,181,0.06)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Login Card */}
      <div className={`relative w-full max-w-[400px] z-10 transition-all duration-300 ${shake ? "animate-shake" : ""}`}>
        <div className="bg-[#1c2027] border border-white/5 rounded-xl shadow-2xl p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center justify-center w-11 h-11 bg-[rgba(0,173,181,0.05)] border border-[rgba(0,173,181,0.15)] text-[#00adb5] rounded-lg text-lg mb-4 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-white mb-2">
              Acesso Restrito
            </h1>
            <p className="text-xs text-[#718096] leading-relaxed">
              Informe a credencial de segurança para entrar no painel.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Input Group */}
            <div className="flex flex-col gap-2">
              <div className="relative flex items-center">
                <ShieldAlert className="absolute left-3.5 w-4 h-4 text-[#718096] pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Insira sua senha..."
                  className="w-full h-11 pl-10 pr-10 bg-white/[0.02] border-white/5 focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/20 text-white rounded-lg text-sm transition-all placeholder:text-[#718096]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#718096] hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400 animate-in fade-in slide-in-from-top-2 duration-200">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#00adb5] hover:bg-[#00adb5]/90 text-white font-medium rounded-lg text-sm shadow-lg shadow-[#00adb5]/10 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </Button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <Button
              variant="link"
              asChild
              className="text-xs text-[#718096] hover:text-white transition-colors h-auto p-0"
            >
              <a href="/" className="inline-flex items-center gap-1.5 no-underline group">
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                <span>Voltar ao site</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
