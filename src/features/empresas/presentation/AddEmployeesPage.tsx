import { useState } from 'react';
import { ArrowRight, ChevronLeft, KeyRound, LoaderCircle, Plus, TriangleAlert, Users, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { gradienteAvatar, iniciais } from '@/shared/presentation/lib/avatar';
import { adicionarFuncionario } from '../infrastructure/empresas-api';

interface EmployeeRow {
  key: string;
  name: string;
  role: string;
  color: string;
  status: string;
}

interface AddEmployeesPageProps {
  companyName?: string | null;
  empresaHandle: number | null;
  onComplete: (employees: EmployeeRow[]) => void;
  onBack: () => void;
}

export function AddEmployeesPage({ companyName, empresaHandle, onComplete, onBack }: AddEmployeesPageProps) {
  const [key, setKey] = useState("");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState<string | null>(null);

  const handleAdd = async () => {
    setError("");
    const trimmed = key.trim().toUpperCase();
    if (!trimmed) return;

    if (employees.find(e => e.key === trimmed)) {
      setError("Esse funcionário já foi adicionado");
      return;
    }

    if (empresaHandle == null) {
      setError("Empresa inválida");
      return;
    }

    setLoading(true);
    try {
      const solicitacao = await adicionarFuncionario(empresaHandle, trimmed);
      const emp: EmployeeRow = { key: trimmed, name: "Funcionário " + trimmed.substring(0, 4), role: "Vistoriador", color: "#6B7280", status: solicitacao.status || "pending" };
      setEmployees(prev => [emp, ...prev]);
      setKey("");
      setPulse(trimmed);
      setTimeout(() => setPulse(null), 500);
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "Erro ao adicionar funcionário");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (k: string) => setEmployees(prev => prev.filter(e => e.key !== k));

  return (
    <div className="onboarding-bg flex items-center justify-center p-6">
      <div className="absolute top-7 left-8 z-10 flex items-center gap-2.5 text-[15px] font-bold">
        <div className="brand-mark size-7 font-serif text-[17px] font-medium">V</div>
        <span>Vistoria Pro</span>
      </div>

      <Card className="relative z-10 w-full max-w-[560px] animate-in gap-0 rounded-2xl p-0 shadow-xl duration-500 fade-in slide-in-from-bottom-4">
        <CardHeader className="gap-1.5 px-8 pt-8">
          <Badge
            variant="outline"
            className="mb-3 h-[26px] gap-2 border-teal-100 bg-teal-50 px-[11px] text-xs font-semibold text-teal-700 dark:text-teal-200"
          >
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(20,184,166,0.2)]" />
            Passo 3 de 3 · {companyName || "Sua empresa"}
          </Badge>
          <CardTitle className="font-serif text-[32px] leading-[1.1] font-normal tracking-[-0.01em]">
            Adicione funcionários
          </CardTitle>
          <p className="text-sm leading-[1.55] text-muted-foreground">
            Convide membros do seu time digitando a <strong className="font-semibold text-foreground">key</strong> de cada um.
            Eles receberão um pedido de aceitação e poderão começar a fazer vistorias após confirmar.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 px-8 pt-6 pb-8">
          <div className="grid gap-1.5">
            <Label htmlFor="employee-key" className="text-[13px] font-semibold">Key do funcionário</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="employee-key"
                  className="h-10 pl-9 font-mono tracking-[0.04em]"
                  placeholder="Ex.: 3fa85f64-5717-4562..."
                  value={key}
                  onChange={e => { setKey(e.target.value.toUpperCase()); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  autoFocus
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
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                Funcionários adicionados
              </span>
              <span className="text-xs text-faint">
                {employees.length} {employees.length === 1 ? "pessoa" : "pessoas"}
              </span>
            </div>

            {employees.length === 0 ? (
              <div className="rounded-md border border-dashed border-border-strong bg-secondary px-4 py-8 text-center text-[13px] text-faint">
                <Users className="mx-auto mb-2 size-[22px]" />
                <div>Nenhum funcionário adicionado ainda.</div>
                <div className="mt-1 text-xs">Você poderá adicionar mais depois.</div>
              </div>
            ) : (
              <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto pr-1">
                {employees.map(emp => (
                  <div
                    key={emp.key}
                    className={`flex animate-in items-center gap-3 rounded-md border bg-secondary px-3 py-2.5 duration-300 slide-in-from-left-2 ${
                      pulse === emp.key ? "border-teal-100 bg-teal-50 dark:border-teal-500/25 dark:bg-teal-500/10" : ""
                    }`}
                  >
                    <Avatar className="size-9">
                      <AvatarFallback
                        className="text-[13px] font-semibold text-white"
                        style={gradienteAvatar(emp.color)}
                      >
                        {iniciais(emp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] leading-tight font-semibold">{emp.name}</div>
                      <div className="mt-0.5 truncate font-mono text-[11.5px] text-muted-foreground">
                        {emp.key} · {emp.role}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-transparent bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      Pendente
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-faint hover:text-red-500"
                      onClick={() => handleRemove(emp.key)}
                      title="Remover"
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-1 flex gap-2">
            <Button variant="outline" size="lg" className="h-11 shrink-0" onClick={onBack}>
              <ChevronLeft /> Voltar
            </Button>
            <Button size="lg" className="h-11 flex-1 text-[15px]" onClick={() => onComplete(employees)}>
              {employees.length === 0 ? "Pular e continuar" : "Continuar"}
              <ArrowRight />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
