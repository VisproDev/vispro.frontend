import { useEffect, useState } from 'react';
import { EllipsisVertical, Trash, TriangleAlert, UserPlus, Users, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { gradienteAvatar, iniciais } from '@/shared/presentation/lib/avatar';
import { cancelarSolicitacao, listarFuncionarios, removerFuncionario } from '../infrastructure/empresas-api';
import type { FuncionarioEmpresa, StatusSolicitacao } from '../domain/empresa';
import type { ContaAutenticada } from '@/features/auth/domain/conta';
import type { CompanyResult } from './CreateCompanyPage';

interface FuncionariosPageProps {
  account: ContaAutenticada | null;
  company: CompanyResult | null;
  onAddFuncionario: () => void;
}

interface PendingAction {
  kind: "cancelar" | "remover";
  funcionario: FuncionarioEmpresa;
}

const STATUS_BADGE: Record<StatusSolicitacao, { className: string; label: string }> = {
  Pendente: {
    className: "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    label: "Pendente",
  },
  Aceito: {
    className: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    label: "Aceito",
  },
  Negado: {
    className: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    label: "Negado",
  },
};

const TH_CLASS = "h-auto bg-secondary px-5 py-3 text-[11px] font-semibold tracking-[0.06em] text-faint uppercase";
const TD_CLASS = "px-5 py-3.5 text-[13.5px]";

export function FuncionariosPage({ account, company, onAddFuncionario }: FuncionariosPageProps) {
  const empresaHandle = company?.empresaHandle ?? null;
  const vaiCarregar = empresaHandle != null && !company?.isEmployee;

  const [solicitacoes, setSolicitacoes] = useState<FuncionarioEmpresa[]>([]);
  const [loading, setLoading] = useState(vaiCarregar);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    if (empresaHandle == null || company?.isEmployee) return;
    listarFuncionarios(empresaHandle)
      .then(setSolicitacoes)
      .catch(err => setError((err instanceof Error ? err.message : "") || "Erro ao carregar funcionários"))
      .finally(() => setLoading(false));
  }, [empresaHandle, company?.isEmployee]);

  const aceitos = solicitacoes.filter(s => s.status === "Aceito");
  const pendentes = solicitacoes.filter(s => s.status === "Pendente");
  const totalPessoas = 1 + aceitos.length;

  function askCancelar(s: FuncionarioEmpresa) {
    setPendingAction({ kind: "cancelar", funcionario: s });
  }

  function askRemover(s: FuncionarioEmpresa) {
    setPendingAction({ kind: "remover", funcionario: s });
  }

  async function handleConfirmPendingAction() {
    if (!pendingAction || empresaHandle == null) return;
    const { kind, funcionario } = pendingAction;
    setActionLoading(funcionario.handle);
    try {
      if (kind === "cancelar") {
        await cancelarSolicitacao(empresaHandle, funcionario.handle);
      } else {
        await removerFuncionario(empresaHandle, funcionario.handle);
      }
      setSolicitacoes(prev => prev.filter(x => x.handle !== funcionario.handle));
      setPendingAction(null);
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || (kind === "cancelar" ? "Erro ao cancelar solicitação" : "Erro ao remover funcionário"));
      setPendingAction(null);
    } finally {
      setActionLoading(null);
    }
  }

  const pendingNome = pendingAction
    ? [pendingAction.funcionario.nome, pendingAction.funcionario.sobrenome].filter(Boolean).join(" ")
    : "";
  const confirmLoading = pendingAction != null && actionLoading === pendingAction.funcionario.handle;

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
            Funcionários
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalPessoas} {totalPessoas === 1 ? "pessoa" : "pessoas"} no time · {pendentes.length}{" "}
            {pendentes.length === 1 ? "convite pendente" : "convites pendentes"}
          </p>
        </div>
        <Button onClick={onAddFuncionario}>
          <UserPlus />
          Adicionar funcionário
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-3 py-2.5">
          <TriangleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="gap-0 overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={TH_CLASS}>Pessoa</TableHead>
              <TableHead className={TH_CLASS}>Cargo</TableHead>
              <TableHead className={TH_CLASS}>Key</TableHead>
              <TableHead className={TH_CLASS}>Vistorias</TableHead>
              <TableHead className={TH_CLASS}>Status</TableHead>
              <TableHead className={`${TH_CLASS} w-11`} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {account && (
              <TableRow>
                <TableCell className={TD_CLASS}>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-9">
                      <AvatarFallback
                        className="text-[13px] font-semibold text-white"
                        style={gradienteAvatar(account.color)}
                      >
                        {iniciais(account.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-[13.5px] leading-tight font-semibold">{account.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{account.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={TD_CLASS}>{company?.isEmployee ? "Funcionário" : "Proprietário"}</TableCell>
                <TableCell className={`${TD_CLASS} font-mono text-[12.5px] text-muted-foreground`}>
                  {account.key}
                </TableCell>
                <TableCell className={TD_CLASS}>0</TableCell>
                <TableCell className={TD_CLASS}>
                  <Badge variant="outline" className={`gap-1.5 ${STATUS_BADGE.Aceito.className}`}>
                    <span className="size-1.5 rounded-full bg-current" />
                    Owner
                  </Badge>
                </TableCell>
                <TableCell className={TD_CLASS} />
              </TableRow>
            )}

            {loading && (
              <TableRow>
                <TableCell className={TD_CLASS} colSpan={6}>
                  <Skeleton className="h-9 w-full" />
                </TableCell>
              </TableRow>
            )}

            {solicitacoes.map(s => {
              const status = STATUS_BADGE[s.status];
              const nomeCompleto = [s.nome, s.sobrenome].filter(Boolean).join(" ");
              return (
                <TableRow key={s.handle}>
                  <TableCell className={TD_CLASS}>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-9">
                        <AvatarFallback
                          className="text-[13px] font-semibold text-white"
                          style={gradienteAvatar()}
                        >
                          {iniciais(nomeCompleto)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-[13.5px] leading-tight font-semibold">{nomeCompleto}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{s.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={TD_CLASS}>Funcionário</TableCell>
                  <TableCell className={`${TD_CLASS} font-mono text-[12.5px] text-muted-foreground`}>
                    {s.keyPublica}
                  </TableCell>
                  <TableCell className={TD_CLASS}>0</TableCell>
                  <TableCell className={TD_CLASS}>
                    <Badge variant="outline" className={`gap-1.5 ${status.className}`}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className={TD_CLASS}>
                    {(s.status === "Pendente" || s.status === "Aceito") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-7 text-faint"
                            disabled={actionLoading === s.handle}
                          >
                            <EllipsisVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-50">
                          {s.status === "Pendente" && (
                            <DropdownMenuItem variant="destructive" onSelect={() => askCancelar(s)}>
                              <X />
                              Cancelar solicitação
                            </DropdownMenuItem>
                          )}
                          {s.status === "Aceito" && (
                            <DropdownMenuItem variant="destructive" onSelect={() => askRemover(s)}>
                              <Trash />
                              Remover funcionário
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {!loading && solicitacoes.length === 0 && (
          <div className="px-5 py-12 text-center text-faint">
            <Users className="mx-auto mb-2.5 size-[26px]" />
            <div className="mb-1 text-sm font-semibold text-foreground">Nenhum funcionário ainda</div>
            <div className="text-[13px]">Adicione pessoas usando a key delas.</div>
          </div>
        )}
      </Card>

      <AlertDialog
        open={pendingAction != null}
        onOpenChange={open => { if (!open && !confirmLoading) setPendingAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.kind === "cancelar" ? "Cancelar solicitação?" : "Remover funcionário?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.kind === "cancelar"
                ? `O convite enviado para ${pendingNome} será cancelado.`
                : `${pendingNome} perderá o acesso à empresa. Essa ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmLoading}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={confirmLoading}
              onClick={e => { e.preventDefault(); handleConfirmPendingAction(); }}
            >
              {confirmLoading
                ? "Aguarde…"
                : pendingAction?.kind === "cancelar"
                  ? "Cancelar solicitação"
                  : "Remover funcionário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
