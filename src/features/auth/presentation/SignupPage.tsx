import { useState } from 'react';
import { ArrowRight, LoaderCircle, Mail, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cadastrarEAutenticar } from '../application/cadastrar-usuario';
import type { ContaAutenticada } from '../domain/conta';

interface SignupPageProps {
  onComplete: (account: ContaAutenticada) => void;
  onNavigateToLogin?: () => void;
}

const STRENGTH_LABELS = ["Muito curta", "Fraca", "Boa", "Forte"];
const STRENGTH_TEXT = ["text-red-500", "text-orange-500", "text-teal-500", "text-green-500"];
const STRENGTH_BAR = [
  "[&_[data-slot=progress-indicator]]:bg-red-500",
  "[&_[data-slot=progress-indicator]]:bg-orange-500",
  "[&_[data-slot=progress-indicator]]:bg-teal-500",
  "[&_[data-slot=progress-indicator]]:bg-green-500",
];

export function SignupPage({ onComplete, onNavigateToLogin }: SignupPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const strength = password.length >= 10 ? 3 : password.length >= 8 ? 2 : password.length >= 5 ? 1 : 0;
  const canContinue = name.trim().length >= 3 && emailOk && password.length >= 8 && accept;

  const handleSubmit = async () => {
    if (!canContinue) {
      if (name.trim().length < 3) setError("Digite seu nome completo");
      else if (!emailOk) setError("Digite um e-mail válido");
      else if (password.length < 8) setError("A senha precisa de pelo menos 8 caracteres");
      else setError("Aceite os termos para continuar");
      return;
    }
    setLoading(true);
    try {
      const parts = name.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || firstName;

      const usuario = await cadastrarEAutenticar({
        nome: firstName,
        sobrenome: lastName,
        email: email.trim().toLowerCase(),
        senha: password,
      });

      onComplete({
        ...usuario,
        name: `${usuario.nome} ${usuario.sobrenome}`.trim(),
        color: "#0D9488",
        key: usuario.keyPublica,
      });
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "Erro ao criar conta");
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
          <Badge
            variant="outline"
            className="mb-3 h-[26px] gap-2 border-teal-100 bg-teal-50 px-[11px] text-xs font-semibold text-teal-700 dark:text-teal-200"
          >
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(20,184,166,0.2)]" />
            Passo 1 de 3
          </Badge>
          <CardTitle className="font-serif text-[32px] leading-[1.1] font-normal tracking-[-0.01em]">
            Crie sua conta
          </CardTitle>
          <p className="text-sm leading-[1.55] text-muted-foreground">
            Sua conta é pessoal. Depois dela você escolhe: criar uma empresa ou entrar em uma que já existe.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 px-9 pt-6">
          <div className="grid gap-1.5">
            <Label htmlFor="signup-name" className="text-[13px] font-semibold">Nome completo</Label>
            <Input
              id="signup-name"
              className="h-10"
              placeholder="Ex.: João Silva"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="signup-email" className="text-[13px] font-semibold">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                className="h-10 pl-9"
                placeholder="voce@empresa.com.br"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="signup-password" className="text-[13px] font-semibold">Senha</Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={show ? "text" : "password"}
                className="h-10 pr-[86px]"
                placeholder="Mínimo de 8 caracteres"
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
            {password.length > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <Progress
                  value={((strength + 1) / 4) * 100}
                  className={`h-[3px] flex-1 bg-surface-3 ${STRENGTH_BAR[strength]}`}
                />
                <span className={`text-[11.5px] font-semibold ${STRENGTH_TEXT[strength]}`}>
                  {STRENGTH_LABELS[strength]}
                </span>
              </div>
            )}
          </div>

          <Label
            htmlFor="signup-accept"
            className="items-start gap-2.5 rounded-md border bg-secondary p-3.5 text-[13px] font-normal"
          >
            <Checkbox
              id="signup-accept"
              checked={accept}
              onCheckedChange={v => { setAccept(v === true); setError(""); }}
              className="mt-0.5 bg-card"
            />
            <span>
              Li e aceito os{" "}
              <a href="#" onClick={e => e.preventDefault()} className="font-semibold text-primary">termos de uso</a>{" "}
              e a{" "}
              <a href="#" onClick={e => e.preventDefault()} className="font-semibold text-primary">política de privacidade</a>
            </span>
          </Label>

          {error && (
            <Alert variant="destructive" className="py-2.5">
              <TriangleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button size="lg" className="h-11 w-full text-[15px]" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><LoaderCircle className="animate-spin" /> Criando conta…</>
            ) : (
              <>Criar conta <ArrowRight /></>
            )}
          </Button>
        </CardContent>

        <CardFooter className="mt-5 justify-center border-t px-9 pt-[18px] pb-8 text-[12.5px] text-muted-foreground">
          <span>
            Já tem conta?{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-[12.5px] font-semibold"
              onClick={() => onNavigateToLogin?.()}
            >
              Fazer login
            </Button>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
