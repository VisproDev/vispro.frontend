import { useState } from 'react';
import { CircleCheck, KeyRound, LoaderCircle, Mail, Plus, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { adicionarFuncionario, adicionarFuncionarioPorEmail } from '../infrastructure/empresas-api';

interface AddFuncionarioPageProps {
  empresaHandle: number | null;
  onAdded?: () => void;
}

type ModoConvite = "key" | "email";

const PASSOS = [
  <>O funcionário cria uma conta gratuita no Vistoria Pro</>,
  <>Você adiciona o funcionário pela <strong className="font-semibold text-foreground">key</strong> ou pelo <strong className="font-semibold text-foreground">e-mail</strong> cadastrado na conta</>,
  <>Clique em <strong className="font-semibold text-foreground">Adicionar</strong> para enviar o convite</>,
  <>Ele aceita o convite no celular ou no e-mail e passa a fazer parte do time</>,
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddFuncionarioPage({ empresaHandle, onAdded }: AddFuncionarioPageProps) {
  const [modo, setModo] = useState<ModoConvite>("key");
  const [key, setKey] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAdd = async () => {
    setError("");
    setSuccess("");

    if (empresaHandle == null) {
      setError("Empresa inválida");
      return;
    }

    const trimmedKey = key.trim().toUpperCase();
    const trimmedEmail = email.trim();
    if (modo === "key" && !trimmedKey) return;
    if (modo === "email" && !trimmedEmail) return;

    if (modo === "email" && !EMAIL_REGEX.test(trimmedEmail)) {
      setError("E-mail inválido — confira o endereço informado");
      return;
    }

    setLoading(true);
    try {
      if (modo === "key") {
        await adicionarFuncionario(empresaHandle, trimmedKey);
        setSuccess(`Convite enviado para ${trimmedKey}.`);
        setKey("");
      } else {
        await adicionarFuncionarioPorEmail(empresaHandle, trimmedEmail);
        setSuccess(`Convite enviado para ${trimmedEmail}.`);
        setEmail("");
      }
      onAdded?.();
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "Erro ao adicionar funcionário");
    } finally {
      setLoading(false);
    }
  };

  const trocarModo = (valor: string) => {
    if (!valor) return;
    setModo(valor as ModoConvite);
    setError("");
    setSuccess("");
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
          Adicionar funcionário
        </h1>
        <p className="text-sm text-muted-foreground">
          Digite a key ou o e-mail do funcionário para enviar um convite.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="gap-0 p-5">
          <CardHeader className="gap-0 px-0">
            <CardTitle className="text-[15px] font-bold">Convidar funcionário</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-3 px-0 pt-4">
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              value={modo}
              onValueChange={trocarModo}
              className="w-full"
            >
              <ToggleGroupItem value="key" className="h-10 flex-1 gap-2">
                <KeyRound className="size-3.5" />
                Pela key
              </ToggleGroupItem>
              <ToggleGroupItem value="email" className="h-10 flex-1 gap-2">
                <Mail className="size-3.5" />
                Por e-mail
              </ToggleGroupItem>
            </ToggleGroup>

            {modo === "key" ? (
              <div className="grid gap-1.5">
                <Label htmlFor="funcionario-key" className="text-[13px] font-semibold">Key do funcionário</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="funcionario-key"
                      className="h-10 pl-9 font-mono tracking-[0.04em]"
                      placeholder="FUNC-XXXX"
                      value={key}
                      onChange={e => { setKey(e.target.value.toUpperCase()); setError(""); setSuccess(""); }}
                      onKeyDown={e => e.key === "Enter" && handleAdd()}
                    />
                  </div>
                  <Button
                    className="h-10 bg-green-500 text-white hover:bg-green-700"
                    onClick={handleAdd}
                    disabled={loading || !key.trim()}
                  >
                    {loading ? <LoaderCircle className="animate-spin" /> : <Plus />}
                    Adicionar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor="funcionario-email" className="text-[13px] font-semibold">E-mail do funcionário</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="funcionario-email"
                      type="email"
                      className="h-10 pl-9"
                      placeholder="nome@exemplo.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); setSuccess(""); }}
                      onKeyDown={e => e.key === "Enter" && handleAdd()}
                    />
                  </div>
                  <Button
                    className="h-10 bg-green-500 text-white hover:bg-green-700"
                    onClick={handleAdd}
                    disabled={loading || !email.trim()}
                  >
                    {loading ? <LoaderCircle className="animate-spin" /> : <Plus />}
                    Adicionar
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-1 py-2.5">
                <TriangleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mt-1 border-green-500/30 py-2.5 text-green-700 dark:text-green-500 [&>svg]:text-current">
                <CircleCheck />
                <AlertDescription className="text-green-700 dark:text-green-500">{success}</AlertDescription>
              </Alert>
            )}
            {!error && !success && (
              <p className="mt-1 text-xs text-muted-foreground">
                {modo === "key"
                  ? <>Não tem a key? Peça para o funcionário copiar em <em>Perfil → Minha key</em>.</>
                  : <>O funcionário precisa ter uma conta no Vistoria Pro com esse e-mail.</>}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 border-dashed border-border-strong bg-secondary p-5 shadow-none">
          <CardHeader className="gap-0 px-0">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Plus className="size-3.5 text-primary" />
              Como funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pt-3.5">
            <ol className="flex flex-col gap-3">
              {PASSOS.map((passo, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-normal text-muted-foreground">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-bold text-teal-700 dark:bg-teal-500/15 dark:text-teal-200">
                    {i + 1}
                  </span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
