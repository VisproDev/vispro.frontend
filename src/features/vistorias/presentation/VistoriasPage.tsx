import { useEffect, useState } from 'react';
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DoorOpen,
  LogOut,
  MapPin,
  Plus,
  Search,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { gradienteAvatar, iniciais } from '@/shared/presentation/lib/avatar';
import { listarFuncionarios } from '@/features/empresas/infrastructure/empresas-api';
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import type { ContaAutenticada } from '@/features/auth/domain/conta';
import {
  calcularStatusVistoria,
  type PaginaVistorias,
  type StatusFiltroVistoria,
  type StatusVistoriaComputado,
  type TipoVistoria,
  type Vistoria,
} from '../domain/vistoria';
import { listarVistorias } from '../infrastructure/vistorias-api';

interface VistoriasPageProps {
  account: ContaAutenticada | null;
  company: CompanyResult | null;
  onNovaVistoria: () => void;
  onAbrirVistoria: (vistoria: Vistoria) => void;
}

interface OpcaoVistoriadorFiltro {
  handle: number;
  nome: string;
}

const TAMANHO_PAGINA = 10;
const TODOS = "todos";

const STATUS_FILTROS: { valor: StatusFiltroVistoria; label: string }[] = [
  { valor: "Todas", label: "Todas" },
  { valor: "Hoje", label: "Hoje" },
  { valor: "Proximas", label: "Próximas" },
  { valor: "EmAberto", label: "Em aberto" },
  { valor: "Concluidas", label: "Concluídas" },
];

const TIPO_INFO: Record<TipoVistoria, { label: string; icone: typeof DoorOpen; className: string }> = {
  Entrada: {
    label: "Entrada",
    icone: DoorOpen,
    className: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  },
  Saida: {
    label: "Saída",
    icone: LogOut,
    className: "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  },
  Predial: {
    label: "Predial",
    icone: Building2,
    className: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  },
  Conferencia: {
    label: "Conferência",
    icone: ClipboardCheck,
    className: "border-transparent bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  },
};

const STATUS_BADGE_CLASS: Record<StatusVistoriaComputado, string> = {
  Agendada: "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  "Em andamento": "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Concluída": "border-transparent bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
};

const TH_CLASS = "h-auto bg-secondary px-5 py-3 text-[11px] font-semibold tracking-[0.06em] text-faint uppercase";
const TD_CLASS = "px-5 py-3.5 text-[13.5px] whitespace-normal";

/** "2026-09-09" → Date no fuso local. */
function dataDoISO(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** "Ter, 09/09" */
function dataCurta(iso: string) {
  const data = dataDoISO(iso);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const semana = data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${dia}/${mes}`;
}

/** "9 de setembro de 2026" */
function dataPorExtenso(iso: string) {
  return dataDoISO(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function formatDuracao(minutos: number) {
  if (minutos % 60 === 0) return `${minutos / 60}h`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas > 0 ? `${horas}h${resto}` : `${resto}min`;
}

export function VistoriasPage({ account, company, onNovaVistoria, onAbrirVistoria }: VistoriasPageProps) {
  const empresaHandle = company?.empresaHandle ?? null;
  const ehDono = company != null && !company.isEmployee;

  const [statusFiltro, setStatusFiltro] = useState<StatusFiltroVistoria>("Todas");
  const [tipoFiltro, setTipoFiltro] = useState<TipoVistoria | typeof TODOS>(TODOS);
  const [vistoriadorFiltro, setVistoriadorFiltro] = useState<string>(TODOS);
  const [enderecoInput, setEnderecoInput] = useState("");
  const [enderecoFiltro, setEnderecoFiltro] = useState("");
  const [pagina, setPagina] = useState(1);

  const [resultado, setResultado] = useState<PaginaVistorias | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vistoriadores, setVistoriadores] = useState<OpcaoVistoriadorFiltro[]>([]);

  // Debounce da busca por endereço.
  useEffect(() => {
    const id = setTimeout(() => setEnderecoFiltro(enderecoInput.trim()), 350);
    return () => clearTimeout(id);
  }, [enderecoInput]);

  // Qualquer mudança de filtro volta para a primeira página.
  useEffect(() => {
    setPagina(1);
  }, [statusFiltro, tipoFiltro, vistoriadorFiltro, enderecoFiltro]);

  // Só o dono consegue listar o time para o filtro de vistoriador.
  useEffect(() => {
    if (empresaHandle == null || !ehDono) return;
    listarFuncionarios(empresaHandle)
      .then(lista =>
        setVistoriadores(
          lista
            .filter(f => f.status === "Aceito")
            .map(f => ({ handle: f.handle, nome: [f.nome, f.sobrenome].filter(Boolean).join(" ") })),
        ),
      )
      .catch(() => {});
  }, [empresaHandle, ehDono]);

  useEffect(() => {
    if (empresaHandle == null) return;
    let cancelado = false;
    setLoading(true);
    setError("");
    listarVistorias(empresaHandle, {
      status: statusFiltro,
      tipo: tipoFiltro === TODOS ? undefined : tipoFiltro,
      endereco: enderecoFiltro || undefined,
      vistoriadorHandle: vistoriadorFiltro === TODOS ? undefined : Number(vistoriadorFiltro),
      pagina,
      tamanhoPagina: TAMANHO_PAGINA,
    })
      .then(res => { if (!cancelado) setResultado(res); })
      .catch(err => {
        if (!cancelado) setError((err instanceof Error ? err.message : "") || "Erro ao carregar vistorias");
      })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [empresaHandle, statusFiltro, tipoFiltro, enderecoFiltro, vistoriadorFiltro, pagina]);

  const itens = resultado?.itens ?? [];
  const totalPaginas = resultado?.totalPaginas ?? 1;
  const vistoriadorOpcoes: OpcaoVistoriadorFiltro[] = account
    ? [{ handle: account.handle, nome: `${account.name} (você)` }, ...vistoriadores.filter(v => v.handle !== account.handle)]
    : vistoriadores;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
            Vistorias
          </h1>
          <p className="text-sm text-muted-foreground">
            {resultado ? `${resultado.total} ${resultado.total === 1 ? "vistoria" : "vistorias"} no total` : "Carregando…"}
          </p>
        </div>
        <Button onClick={onNovaVistoria}>
          <Plus />
          Nova vistoria
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          value={statusFiltro}
          onValueChange={valor => { if (valor) setStatusFiltro(valor as StatusFiltroVistoria); }}
        >
          {STATUS_FILTROS.map(opcao => (
            <ToggleGroupItem key={opcao.valor} value={opcao.valor} className="h-8 text-[12.5px] font-semibold">
              {opcao.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              className="h-9 w-48 pl-8"
              placeholder="Buscar endereço…"
              value={enderecoInput}
              onChange={e => setEnderecoInput(e.target.value)}
            />
          </div>

          <Select value={tipoFiltro} onValueChange={valor => setTipoFiltro(valor as TipoVistoria | typeof TODOS)}>
            <SelectTrigger className="h-9 w-40" size="sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os tipos</SelectItem>
              {(Object.keys(TIPO_INFO) as TipoVistoria[]).map(tipo => (
                <SelectItem key={tipo} value={tipo}>{TIPO_INFO[tipo].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {ehDono && (
            <Select value={vistoriadorFiltro} onValueChange={setVistoriadorFiltro}>
              <SelectTrigger className="h-9 w-52" size="sm">
                <SelectValue placeholder="Vistoriador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os vistoriadores</SelectItem>
                {vistoriadorOpcoes.map(v => (
                  <SelectItem key={v.handle} value={String(v.handle)}>{v.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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
              <TableHead className={`${TH_CLASS} w-28`}>Data</TableHead>
              <TableHead className={TH_CLASS}>Imóvel</TableHead>
              <TableHead className={TH_CLASS}>Cliente</TableHead>
              <TableHead className={TH_CLASS}>Vistoriador</TableHead>
              <TableHead className={TH_CLASS}>Tipo</TableHead>
              <TableHead className={TH_CLASS}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                  <TableCell className={TD_CLASS} colSpan={6}>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!loading && itens.map(vistoria => {
              const tipo = TIPO_INFO[vistoria.tipo];
              const status = calcularStatusVistoria(vistoria);
              const nomeVistoriador = [vistoria.vistoriador.nome, vistoria.vistoriador.sobrenome].filter(Boolean).join(" ");
              return (
                <TableRow key={vistoria.handle} className="cursor-pointer" onClick={() => onAbrirVistoria(vistoria)}>
                  <TableCell className={TD_CLASS}>
                    <div className="font-semibold">{dataCurta(vistoria.data)}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">{vistoria.horario}</div>
                  </TableCell>
                  <TableCell className={TD_CLASS}>
                    <div className="font-semibold">{vistoria.endereco}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{vistoria.bairroCidade}</span>
                    </div>
                  </TableCell>
                  <TableCell className={`${TD_CLASS} text-muted-foreground`}>{vistoria.cliente}</TableCell>
                  <TableCell className={TD_CLASS}>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[11px] font-semibold text-white" style={gradienteAvatar()}>
                          {iniciais(nomeVistoriador)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[12.5px]">{nomeVistoriador}</span>
                    </div>
                  </TableCell>
                  <TableCell className={TD_CLASS}>
                    <Badge variant="outline" className={`gap-1.5 ${tipo.className}`}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {tipo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className={TD_CLASS}>
                    <Badge variant="outline" className={`gap-1.5 ${STATUS_BADGE_CLASS[status]}`}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {!loading && itens.length === 0 && (
          <div className="px-5 py-12 text-center text-faint">
            <ClipboardList className="mx-auto mb-2.5 size-[26px]" />
            <div className="mb-1 text-sm font-semibold text-foreground">Nenhuma vistoria encontrada</div>
            <div className="text-[13px]">Ajuste os filtros ou agende uma nova vistoria.</div>
          </div>
        )}

        {!loading && itens.length > 0 && (
          <div className="flex items-center justify-between border-t px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Página {resultado?.pagina ?? 1} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagina <= 1}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
              >
                <ChevronLeft />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              >
                Próxima
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
