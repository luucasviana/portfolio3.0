"use client";

import React, { useState } from "react";
import { loginAction } from "../actions";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden select-none bg-background">
      {/* Radial gradient background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none rounded-full blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.07) 0%, transparent 70%)",
        }}
      />

      <Card
        className={cn(
          "w-full max-w-[400px] relative z-10 border-border/40 bg-card/90 backdrop-blur-md shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)]"
        )}
      >
        <CardHeader className="items-center text-center pb-0">
          {/* Shield icon */}
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.1)] transition-transform duration-300 hover:scale-105">
            <i className="fa-solid fa-shield-halved text-base" />
          </div>

          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Console Administrativo
          </CardTitle>
          <CardDescription className="text-xs font-light leading-relaxed">
            Insira sua chave mestra para gerenciar o portfólio.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Senha de Acesso
              </Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground text-sm pointer-events-none">
                  <i className="fa-solid fa-lock" />
                </span>
                <Input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha..."
                  className="h-10 pl-9 bg-background/50"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                <i className="fa-solid fa-triangle-exclamation" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="w-full h-10 font-extrabold tracking-wide shadow-[0_4px_12px_hsl(var(--primary)/0.15)] hover:shadow-[0_4px_20px_hsl(var(--primary)/0.3)] cursor-pointer"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Autenticando...
                </>
              ) : (
                <>
                  Entrar no Painel{" "}
                  <i className="fa-solid fa-arrow-right-to-bracket text-xs ml-0.5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <Separator />

        <CardFooter className="justify-center border-t-0 bg-transparent">
          <Button variant="ghost" asChild className="text-xs text-muted-foreground hover:text-primary">
            <a href="/">
              <i className="fa-solid fa-chevron-left text-[10px]" /> Voltar ao
              site principal
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
