import { useState } from 'react';
import { ArrowRight, Bell, CalendarDays, Check, ClipboardList, Clock, MapPin, Plus, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { gradienteAvatar, iniciais } from '@/shared/presentation/lib/avatar';
import type { ContaAutenticada } from '@/features/auth/domain/conta';
import type { AlertaDashboard, StatusVistoria, TomAlerta, Vistoria } from '../domain/dashboard';
import {
  ALERTAS,
  PRODUTIVIDADE_SEMANA,
  RANKING_VISTORIADORES,
  VISTORIAS_DE_HOJE,
  VISTORIAS_NO_MES,
} from '../infrastructure/dashboard-mock';

interface DashboardPageProps {
  account: ContaAutenticada | null;
}

const STATUS_VISTORIA: Record<StatusVistoria, string> = {
  "Concluída": "border-transparent bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  "Em andamento": "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Agendada": "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
};

const TOM_ALERTA: Record<TomAlerta, { icone: typeof Clock; className: string }> = {
  sucesso: { icone: Clock, className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" },
  info: { icone: Bell, className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
};

const CARD_HEADER_CLASS = "items-center gap-2 border-b px-5 py-4";
const CARD_ACTION_CLASS = "h-auto p-0 text-[13px] font-semibold";

function saudacao(hora: number) {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** "Terça, 18 de agosto" */
function dataPorExtenso(data: Date) {
  const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "");
  const resto = data.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  return `${diaSemana.charAt(0).toUpperCase()}${diaSemana.slice(1)}, ${resto}`;
}

/** Linha de vistoria — usada na lista de hoje e no calendário. */
function linhaVistoria(vistoria: Vistoria, aoSelecionar: () => void) {
  return (
    <button
      key={vistoria.handle}
      type="button"
      onClick={aoSelecionar}
      className="flex w-full items-center gap-4 border-b px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-muted/60"
    >
      <time className="w-11 shrink-0 font-mono text-[12.5px] text-muted-foreground">{vistoria.horario}</time>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] leading-tight font-semibold">
          {vistoria.tipo} · {vistoria.endereco}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0 text-faint" />
          <span className="truncate">{vistoria.bairro}</span>
          <Avatar className="ml-1 size-5">
            <AvatarFallback
              className="text-[9px] font-semibold text-white"
              style={gradienteAvatar(vistoria.corResponsavel)}
            >
              {iniciais(vistoria.responsavel)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{vistoria.responsavel}</span>
        </div>
      </div>
      <Badge variant="outline" className={`shrink-0 gap-1.5 ${STATUS_VISTORIA[vistoria.status]}`}>
        <span className="size-1.5 rounded-full bg-current" />
        {vistoria.status}
      </Badge>
    </button>
  );
}

export function DashboardPage({ account }: DashboardPageProps) {
  const [vistorias, setVistorias] = useState<Vistoria[]>(VISTORIAS_DE_HOJE);
  const [alertas, setAlertas] = useState<AlertaDashboard[]>(ALERTAS);
  const [vistoriaSelecionada, setVistoriaSelecionada] = useState<Vistoria | null>(null);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [novaVistoriaAberta, setNovaVistoriaAberta] = useState(false);
  const [endereco, setEndereco] = useState("");

  const agora = new Date();
  const primeiroNome = account?.name?.split(" ")[0] || "Vistoriador";

  const concluidas = vistorias.filter(v => v.status === "Concluída").length;
  const agendadas = vistorias.filter(v => v.status === "Agendada").length;
  const emAndamento = vistorias.length - concluidas - agendadas;
  const produtividade = vistorias.length ? Math.round((concluidas / vistorias.length) * 100) : 0;

  const metricas = [
    {
      icone: CalendarDays,
      rotulo: "Vistorias do mês",
      valor: VISTORIAS_NO_MES + vistorias.length,
      nota: "dados atualizados agora",
    },
    {
      icone: ClipboardList,
      rotulo: "Concluídas",
      valor: concluidas,
      nota: `${produtividade}% dos registros`,
    },
    {
      icone: Clock,
      rotulo: "Agendadas",
      valor: agendadas,
      nota: `${emAndamento} ${emAndamento === 1 ? "vistoria" : "vistorias"} em andamento`,
    },
    {
      icone: Bell,
      rotulo: "Pendências",
      valor: alertas.length,
      nota: alertas.length ? "precisam de atenção" : "tudo lido",
    },
  ];

  const criarVistoria = (event: React.FormEvent) => {
    event.preventDefault();
    const enderecoLimpo = endereco.trim();
    if (!enderecoLimpo) return;

    setVistorias(atuais => [
      ...atuais,
      {
        handle: Math.max(0, ...atuais.map(v => v.handle)) + 1,
        horario: "16:00",
        tipo: "Nova vistoria",
        endereco: enderecoLimpo,
        bairro: "A definir",
        responsavel: account?.name || primeiroNome,
        corResponsavel: account?.color || "#0D9488",
        status: "Agendada",
      },
    ]);
    setEndereco("");
    setNovaVistoriaAberta(false);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
            {saudacao(agora.getHours())}, <em className="text-primary">{primeiroNome}.</em>
          </h1>
          <p className="text-sm text-muted-foreground">
            {dataPorExtenso(agora)} · {vistorias.length}{" "}
            {vistorias.length === 1 ? "vistoria" : "vistorias"} para hoje
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCalendarioAberto(true)}>
            <CalendarDays />
            Calendário
          </Button>
          <Button onClick={() => setNovaVistoriaAberta(true)}>
            <Plus />
            Nova vistoria
          </Button>
        </div>
      </div>

      <section aria-label="Resumo de vistorias" className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricas.map(metrica => (
          <Card key={metrica.rotulo} className="gap-2 p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
              <span className="flex size-6 items-center justify-center rounded-md bg-teal-50 text-primary dark:bg-teal-500/15">
                <metrica.icone className="size-3.5" />
              </span>
              {metrica.rotulo}
            </div>
            <div className="font-serif text-[34px] leading-none">{metrica.valor}</div>
            <div className="text-xs text-muted-foreground">{metrica.nota}</div>
          </Card>
        ))}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-5">
          <Card className="gap-0 p-0">
            <CardHeader className={CARD_HEADER_CLASS}>
              <CardTitle className="text-[15px] font-bold">Hoje</CardTitle>
              <CardAction className="self-center">
                <Button variant="link" className={CARD_ACTION_CLASS} onClick={() => setCalendarioAberto(true)}>
                  Ver calendário
                  <ArrowRight />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              {vistorias.map(vistoria => linhaVistoria(vistoria, () => setVistoriaSelecionada(vistoria)))}
            </CardContent>
          </Card>

          <Card className="gap-0 p-0">
            <CardHeader className={CARD_HEADER_CLASS}>
              <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
                <Trophy className="size-4 text-primary" />
                Ranking de vistoriadores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {RANKING_VISTORIADORES.map((vistoriador, posicao) => (
                <div
                  key={vistoriador.handle}
                  className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0"
                >
                  <span className="w-4 shrink-0 text-center font-mono text-xs text-faint">{posicao + 1}</span>
                  <Avatar className="size-8">
                    <AvatarFallback
                      className="text-[11px] font-semibold text-white"
                      style={gradienteAvatar(vistoriador.cor)}
                    >
                      {iniciais(vistoriador.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] leading-tight font-semibold">{vistoriador.nome}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">{vistoriador.cargo}</div>
                    <Progress value={vistoriador.desempenho} className="mt-1.5 h-1 bg-secondary" />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {vistoriador.vistorias} {vistoriador.vistorias === 1 ? "vistoria" : "vistorias"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5">
          <Card className="gap-0 p-0">
            <CardHeader className={CARD_HEADER_CLASS}>
              <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
                <Bell className="size-4 text-primary" />
                Alertas e pendências
              </CardTitle>
              <CardAction className="self-center">
                <Button
                  variant="link"
                  className={CARD_ACTION_CLASS}
                  disabled={alertas.length === 0}
                  onClick={() => setAlertas([])}
                >
                  {alertas.length === 0 ? "Tudo lido" : "Marcar como lidas"}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              {alertas.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-faint">Nenhuma pendência nova.</p>
              ) : (
                alertas.map(alerta => {
                  const tom = TOM_ALERTA[alerta.tom];
                  return (
                    <div key={alerta.handle} className="flex gap-3 border-b px-5 py-3.5 last:border-b-0">
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${tom.className}`}>
                        <tom.icone className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] leading-tight font-semibold">{alerta.titulo}</div>
                        <p className="mt-1 text-xs leading-normal text-muted-foreground">{alerta.descricao}</p>
                        <span className="mt-1 block text-[11px] text-faint">{alerta.quando}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-faint"
                        title="Marcar como lida"
                        aria-label={`Marcar "${alerta.titulo}" como lida`}
                        onClick={() => setAlertas(atuais => atuais.filter(a => a.handle !== alerta.handle))}
                      >
                        <Check />
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 p-5">
            <div className="text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
              Produtividade da semana
            </div>
            <div className="mt-2 font-serif text-5xl leading-none text-primary">
              {produtividade}
              <span className="text-2xl">%</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Baseada nas vistorias concluídas no período.
            </p>

            <TooltipProvider>
              <div className="mt-5 flex h-28 items-stretch gap-1.5 border-t pt-4">
                {PRODUTIVIDADE_SEMANA.map(dia => (
                  <Tooltip key={dia.dia}>
                    <TooltipTrigger
                      className="group flex flex-1 flex-col items-center justify-end gap-2 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      aria-label={`${dia.dia}: ${dia.valor}% concluídas`}
                    >
                      <span className="flex w-full flex-1 items-end rounded-sm bg-secondary" aria-hidden="true">
                        <span
                          className="w-full rounded-t-[4px] bg-primary transition-colors group-hover:bg-teal-700"
                          style={{ height: `${dia.valor}%` }}
                        />
                      </span>
                      <span className="text-[10px] font-semibold tracking-[0.06em] text-faint uppercase">
                        {dia.dia}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {dia.dia} · {dia.valor}% concluídas
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </Card>
        </div>
      </div>

      <Dialog open={calendarioAberto} onOpenChange={setCalendarioAberto}>
        <DialogContent className="gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-5 py-4 text-left">
            <DialogTitle>Calendário de vistorias</DialogTitle>
            <DialogDescription>
              {dataPorExtenso(agora)} · {vistorias.length}{" "}
              {vistorias.length === 1 ? "compromisso registrado" : "compromissos registrados"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {vistorias.map(vistoria =>
              linhaVistoria(vistoria, () => {
                setCalendarioAberto(false);
                setVistoriaSelecionada(vistoria);
              }),
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={vistoriaSelecionada != null}
        onOpenChange={aberto => { if (!aberto) setVistoriaSelecionada(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {vistoriaSelecionada?.tipo} · {vistoriaSelecionada?.horario}
            </DialogTitle>
            <DialogDescription>Detalhes da vistoria selecionada.</DialogDescription>
          </DialogHeader>

          {vistoriaSelecionada && (
            <div className="flex gap-3 rounded-md border bg-secondary p-4">
              <Avatar className="size-10">
                <AvatarFallback
                  className="text-[13px] font-semibold text-white"
                  style={gradienteAvatar(vistoriaSelecionada.corResponsavel)}
                >
                  {iniciais(vistoriaSelecionada.responsavel)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{vistoriaSelecionada.endereco}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3 text-faint" />
                  {vistoriaSelecionada.bairro}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Responsável: {vistoriaSelecionada.responsavel}
                </div>
                <Badge
                  variant="outline"
                  className={`mt-2.5 gap-1.5 ${STATUS_VISTORIA[vistoriaSelecionada.status]}`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {vistoriaSelecionada.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button>Fechar detalhes</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={novaVistoriaAberta}
        onOpenChange={aberto => { setNovaVistoriaAberta(aberto); if (!aberto) setEndereco(""); }}
      >
        <DialogContent>
          <form onSubmit={criarVistoria} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Nova vistoria</DialogTitle>
              <DialogDescription>
                Informe o endereço do imóvel para agendar a vistoria.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-1.5">
              <Label htmlFor="nova-vistoria-endereco" className="text-[13px] font-semibold">
                Endereço do imóvel
              </Label>
              <Input
                id="nova-vistoria-endereco"
                className="h-10"
                placeholder="Ex.: Rua Augusta, 120"
                value={endereco}
                onChange={event => setEndereco(event.target.value)}
                autoFocus
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={!endereco.trim()}>Agendar vistoria</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
