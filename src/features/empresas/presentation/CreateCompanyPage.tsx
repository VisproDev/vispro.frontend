import { useState } from 'react';
import { ArrowRight, ChevronLeft, KeyRound, LoaderCircle, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { gradienteAvatar, iniciais } from '@/shared/presentation/lib/avatar';
import { criarEmpresa } from '../infrastructure/empresas-api';

interface Account {
  name: string;
  email: string;
  color: string;
  key: string;
}

export interface CompanyResult {
  isEmployee: boolean;
  companyName: string | null;
  empresaHandle: number | null;
}

interface CreateCompanyPageProps {
  account: Account | null;
  onComplete: (result: CompanyResult) => void;
  onBack?: () => void;
}

export function CreateCompanyPage({ account, onComplete, onBack }: CreateCompanyPageProps) {
  const [name, setName] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canContinue = isEmployee || name.trim().length >= 2;

  const handleContinue = async () => {
    if (!canContinue) {
      setError("Digite o nome da empresa ou marque 'sou funcionário'");
      return;
    }

    if (isEmployee) {
      onComplete({ isEmployee, companyName: null, empresaHandle: null });
      return;
    }

    setLoading(true);
    try {
      const empresa = await criarEmpresa({ nome: name.trim() });
      onComplete({
        isEmployee,
        companyName: name.trim(),
        empresaHandle: empresa.handle,
      });
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "Erro ao criar empresa");
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
            Passo 2 de 3
          </Badge>
          <CardTitle className="font-serif text-[32px] leading-[1.1] font-normal tracking-[-0.01em]">
            {isEmployee ? "Entre em uma empresa" : "Crie sua empresa"}
          </CardTitle>
          <p className="text-sm leading-[1.55] text-muted-foreground">
            {isEmployee
              ? "Passe a key abaixo para o gestor da empresa. Assim que ele adicionar você, o convite aparece aqui."
              : "Vamos preparar o ambiente para você gerenciar suas vistorias. Em alguns segundos, seu time já pode começar."}
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 px-9 pt-6 pb-9">
          {account && (
            <div className="flex items-center gap-2.5 rounded-md border border-teal-100 bg-teal-50 px-3 py-2.5 dark:border-teal-500/25 dark:bg-teal-500/10">
              <Avatar className="size-9">
                <AvatarFallback
                  className="text-[13px] font-semibold text-white"
                  style={gradienteAvatar(account.color)}
                >
                  {iniciais(account.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{account.name}</div>
                <div className="truncate text-[11.5px] text-muted-foreground">{account.email}</div>
              </div>
              <Badge
                variant="outline"
                className="gap-1.5 border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-200"
              >
                <span className="size-1.5 rounded-full bg-current" />
                Conta criada
              </Badge>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="company-name" className="text-[13px] font-semibold">Nome da empresa</Label>
            <Input
              id="company-name"
              type="text"
              className="h-10"
              placeholder="Ex.: Vistoriarte Imóveis"
              value={name}
              disabled={isEmployee}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleContinue()}
              autoFocus
            />
          </div>

          <Label
            htmlFor="is-employee"
            className="items-start gap-2.5 rounded-md border bg-secondary p-3.5 font-normal"
          >
            <Checkbox
              id="is-employee"
              checked={isEmployee}
              onCheckedChange={v => { setIsEmployee(v === true); setError(""); }}
              className="mt-0.5 bg-card"
            />
            <span className="grid gap-0.5">
              <span className="text-sm font-semibold">Sou funcionário</span>
              <span className="text-xs text-muted-foreground">
                Vou entrar em uma empresa já existente, usando minha key
              </span>
            </span>
          </Label>

          {isEmployee && account && (
            <div className="flex items-center gap-3 rounded-md border border-dashed border-border-strong bg-card p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-teal-50 text-primary dark:bg-teal-500/15">
                <KeyRound className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] text-muted-foreground">Sua key de funcionário</div>
                <div className="truncate font-mono text-[15px] font-medium tracking-[0.04em]">{account.key}</div>
              </div>
              <Badge
                variant="outline"
                className="gap-1.5 border-transparent bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
              >
                <span className="size-1.5 rounded-full bg-current" />
                Aguardando convite
              </Badge>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="py-2.5">
              <TriangleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-1 flex gap-2">
            {onBack && (
              <Button variant="outline" size="lg" className="h-11 shrink-0" onClick={onBack} disabled={loading}>
                <ChevronLeft /> Voltar
              </Button>
            )}
            <Button
              size="lg"
              className="h-11 flex-1 text-[15px]"
              onClick={handleContinue}
              disabled={!canContinue || loading}
            >
              {loading ? <LoaderCircle className="animate-spin" /> : <>Continuar <ArrowRight /></>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
