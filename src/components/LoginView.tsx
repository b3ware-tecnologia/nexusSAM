import React, { useState } from "react";
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { apiLogin, apiRegister } from "../api.js";

interface LoginViewProps {
  onLogin: (token: string, user: { id: string; name: string; email: string; role?: string }) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("ericob3ware@gmail.com");
  const [password, setPassword] = useState("b3ware2026");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) { throw new Error("Nome é obrigatório"); }
        const result = await apiRegister(name.trim(), email.trim(), password);
        onLogin(result.token, result.user);
      } else {
        const result = await apiLogin(email.trim(), password);
        onLogin(result.token, result.user);
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center" style={{ background: "#0F1923" }}>
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
            style={{ background: "linear-gradient(135deg, #00A1DE, #00549F)" }}>
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            nexus<span style={{ color: "#00A1DE" }}>SAM</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8A8C8E" }}>
            Snow Atlas SAM Core v2.4
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-8" style={{ background: "#1A2B4C", border: "1px solid #243B5E" }}>
          <h2 className="text-lg font-semibold text-white mb-1">
            {isRegister ? "Criar Conta" : "Entrar"}
          </h2>
          <p className="text-xs mb-6" style={{ color: "#8A8C8E" }}>
            {isRegister
              ? "Registrar uma nova conta de administrador"
              : "Insira suas credenciais para acessar a plataforma"}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
              style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#B0B8C5" }}>
                  Nome
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-3 py-2.5 pl-10 rounded-lg text-sm text-white outline-none transition-all"
                    style={{ background: "#0F1923", border: "1px solid #243B5E" }}
                    onFocus={(e) => e.target.style.borderColor = "#00A1DE"}
                    onBlur={(e) => e.target.style.borderColor = "#243B5E"}
                  />
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5A6D8A" }} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#B0B8C5" }}>
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  className="w-full px-3 py-2.5 pl-10 rounded-lg text-sm text-white outline-none transition-all"
                  style={{ background: "#0F1923", border: "1px solid #243B5E" }}
                  onFocus={(e) => e.target.style.borderColor = "#00A1DE"}
                  onBlur={(e) => e.target.style.borderColor = "#243B5E"}
                />
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5A6D8A" }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#B0B8C5" }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full px-3 py-2.5 pl-10 pr-10 rounded-lg text-sm text-white outline-none transition-all"
                  style={{ background: "#0F1923", border: "1px solid #243B5E" }}
                  onFocus={(e) => e.target.style.borderColor = "#00A1DE"}
                  onBlur={(e) => e.target.style.borderColor = "#243B5E"}
                />
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5A6D8A" }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "#5A6D8A" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00A1DE, #00549F)" }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.opacity = "1"; }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : isRegister ? (
                "Criar Conta"
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="text-xs font-medium cursor-pointer transition-all hover:opacity-80"
              style={{ color: "#00A1DE" }}
            >
              {isRegister
                ? "Já tem uma conta? Entrar"
                : "Não tem uma conta? Cadastre-se"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] mt-6" style={{ color: "#5A6D8A" }}>
          © 2026 Snow Atlas SAM Core. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
