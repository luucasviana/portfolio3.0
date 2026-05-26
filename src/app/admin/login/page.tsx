"use client";

import React, { useState } from "react";
import { loginAction } from "../actions";
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Console Administrativo</CardTitle>
          <CardDescription>
            Insira sua chave mestra para gerenciar o portfólio.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha de Acesso</Label>
              <Input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha..."
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full cursor-pointer">
              {loading ? "Autenticando..." : "Entrar no Painel"}
            </Button>
          </form>
        </CardContent>

        <Separator />

        <CardFooter className="justify-center">
          <Button variant="link" asChild className="text-xs text-muted-foreground">
            <a href="/">← Voltar ao site principal</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
