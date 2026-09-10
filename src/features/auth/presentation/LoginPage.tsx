import { useState } from 'react';
import { ArrowRight, Info, LoaderCircle, Mail, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { iniciarSessao } from '../application/sessao';
import type { ContaAutenticada } from '../domain/conta';
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';

interface LoginPageProps {
  onComplete: (account: ContaAutenticada, company: CompanyResult) => void;
  onNavigateToSignup?: () => void;
  /** ex.: "Sua sessão expirou por inatividade" — exibido como aviso acima do formulário. */
  mensagemInicial?: string;
}

export function LoginPage({ onComplete, onNavigateToSignup, mensagemInicial }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailOk && password.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!emailOk) setError("Digite um e-mail válido");
      else setError("Digite sua senha");
      return;
    }
    setLoading(true);
    try {
      const usuario = await iniciarSessao(email.trim().toLowerCase(), password);
      onComplete(
        {
          handle: usuario.handle,
          keyPublica: usuario.keyPublica,
          nome: usuario.nome,
          sobrenome: usuario.sobrenome,
          email: usuario.email,
          name: `${usuario.nome} ${usuario.sobrenome}`.trim(),
          color: "#0D9488",
          key: usuario.keyPublica,
        },
        {
          isEmployee: usuario.empresaDona == null,
          companyName: usuario.empresaDona?.nome ?? null,
          empresaHandle: usuario.empresaDona?.handle ?? null,
        },
      );
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-bg flex items-center justify-center p-6">
      <div className="absolute top-7 left-8 z-10 flex items-center gap-2.5 text-[15px] font-bold">
        <div className="brand-mark size-7 font-serif text-[17px] font-medium">V</div>
        <span>Vistoria Pro</span>
      </div>

      <Card className="relative z-10 w-full max-w-[460px] animate-in gap-0 rounded-2xl p-0 shadow-xl duration-500 fade-in slide-in-from-bottom-4">
        <CardHeader className="gap-1.5 px-9 pt-9">
          <CardTitle className="font-serif text-[32px] leading-[1.1] font-normal tracking-[-0.01em]">
            Bem-vindo de volta
          </CardTitle>
          <p className="text-sm leading-[1.55] text-muted-foreground">
            Entre com sua conta para acessar suas vistorias e sua empresa.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 px-9 pt-6">
          {mensagemInicial && (
            <Alert className="py-2.5">
              <Info />
              <AlertDescription>{mensagemInicial}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="login-email" className="text-[13px] font-semibold">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                className="h-10 pl-9"
                placeholder="voce@empresa.com.br"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="login-password" className="text-[13px] font-semibold">Senha</Label>
              <Button
                variant="link"
                className="h-auto p-0 text-xs font-semibold"
                onClick={e => e.preventDefault()}
              >
                Esqueci minha senha
              </Button>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={show ? "text" : "password"}
                className="h-10 pr-[86px]"
                placeholder="Sua senha"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1/2 right-1 h-7 -translate-y-1/2 px-2 text-xs font-semibold text-primary hover:text-primary"
                onClick={() => setShow(s => !s)}
              >
                {show ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2.5">
              <TriangleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button size="lg" className="h-11 w-full text-[15px]" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><LoaderCircle className="animate-spin" /> Entrando…</>
            ) : (
              <>Entrar <ArrowRight /></>
            )}
          </Button>
        </CardContent>

        <CardFooter className="mt-5 justify-center border-t px-9 pt-[18px] pb-8 text-[12.5px] text-muted-foreground">
          <span>
            Ainda não tem conta?{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-[12.5px] font-semibold"
              onClick={() => onNavigateToSignup?.()}
            >
              Criar conta
            </Button>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
