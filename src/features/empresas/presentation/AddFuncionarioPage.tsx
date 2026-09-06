import { useState } from 'react';
import { CircleCheck, KeyRound, LoaderCircle, Plus, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adicionarFuncionario } from '../infrastructure/empresas-api';

interface AddFuncionarioPageProps {
  empresaHandle: number | null;
  onAdded?: () => void;
}

const PASSOS = [
  <>O funcionário cria uma conta gratuita no Vistoria Pro</>,
  <>Em <strong className="font-semibold text-foreground">Perfil → Minha key</strong>, ele copia a chave (formato FUNC-XXXX)</>,
  <>Você cola a key acima e clica em <strong className="font-semibold text-foreground">Adicionar</strong></>,
  <>Ele aceita o convite no celular ou no e-mail e passa a fazer parte do time</>,
];

export function AddFuncionarioPage({ empresaHandle, onAdded }: AddFuncionarioPageProps) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAdd = async () => {
    setError("");
    setSuccess("");
    const trimmed = key.trim().toUpperCase();
    if (!trimmed) return;

    if (empresaHandle == null) {
      setError("Empresa inválida");
      return;
    }

    setLoading(true);
    try {
      await adicionarFuncionario(empresaHandle, trimmed);
      setSuccess(`Convite enviado para ${trimmed}.`);
      setKey("");
      onAdded?.();
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "Erro ao adicionar funcionário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
          Adicionar funcionário
        </h1>
        <p className="text-sm text-muted-foreground">
          Digite a key do funcionário para enviar um convite.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="gap-0 p-5">
          <CardHeader className="gap-0 px-0">
            <CardTitle className="text-[15px] font-bold">Convidar pela key</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-1.5 px-0 pt-4">
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
                Não tem a key? Peça para o funcionário copiar em <em>Perfil → Minha key</em>.
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
