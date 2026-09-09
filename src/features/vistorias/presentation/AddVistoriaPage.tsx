import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Check,
  CircleCheck,
  ClipboardCheck,
  Clock,
  DoorOpen,
  LoaderCircle,
  LogOut,
  MapPin,
  Sparkles,
  TriangleAlert,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { gradienteAvatar, iniciais } from '@/shared/presentation/lib/avatar';
import { listarFuncionarios } from '@/features/empresas/infrastructure/empresas-api';
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import type { ContaAutenticada } from '@/features/auth/domain/conta';
import type { TipoVistoria, Vistoria } from '../domain/vistoria';
import { agendarVistoria, atualizarVistoria } from '../infrastructure/vistorias-api';

interface AddVistoriaPageProps {
  account: ContaAutenticada | null;
  company: CompanyResult | null;
  vistoria?: Vistoria | null;
  onCancel?: () => void;
  onAgendada?: (vistoria: Vistoria) => void;
}

interface OpcaoTipo {
  valor: TipoVistoria;
  label: string;
  descricao: string;
  icone: LucideIcon;
}

interface OpcaoVistoriador {
  keyPublica: string;
  nome: string;
  cor?: string;
}

const TIPOS: OpcaoTipo[] = [
  { valor: "Entrada", label: "Entrada", descricao: "Início de locação", icone: DoorOpen },
  { valor: "Saida", label: "Saída", descricao: "Fim de locação", icone: LogOut },
  { valor: "Predial", label: "Vistoria predial", descricao: "Áreas comuns e estrutura", icone: Building2 },
  { valor: "Conferencia", label: "Conferência", descricao: "Acompanhamento periódico", icone: ClipboardCheck },
];

/** Durações oferecidas no formulário (a API aceita de 15 a 480 minutos). */
const DURACOES = [
  { minutos: 60, label: "1h" },
  { minutos: 90, label: "1h30" },
  { minutos: 120, label: "2h" },
  { minutos: 180, label: "3h" },
];

const LABEL_CLASS = "text-[13px] font-semibold";

/** Cartão selecionável — usado no tipo de vistoria e no vistoriador responsável. */
const CARD_ITEM_CLASS =
  "group h-auto justify-start rounded-lg border-border p-3 text-left whitespace-normal " +
  "data-[state=on]:border-primary data-[state=on]:bg-teal-50 data-[state=on]:hover:bg-teal-50 " +
  "dark:data-[state=on]:bg-teal-500/10 dark:data-[state=on]:hover:bg-teal-500/10";

function paraISO(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function amanhaISO() {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  return paraISO(data);
}

/** "2026-09-09" → Date no fuso local (sem o deslocamento que `new Date(iso)` aplicaria). */
function dataDoISO(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** "Amanhã, 9 de setembro" · "Terça, 15 de setembro" */
function rotuloData(iso: string) {
  if (!iso) return "";
  const data = dataDoISO(iso);
  if (Number.isNaN(data.getTime())) return "";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((data.getTime() - hoje.getTime()) / 86400000);
  const extenso = data.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  if (dias === 0) return `Hoje, ${extenso}`;
  if (dias === 1) return `Amanhã, ${extenso}`;
  if (dias === -1) return `Ontem, ${extenso}`;

  const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "");
  return `${diaSemana.charAt(0).toUpperCase()}${diaSemana.slice(1)}, ${extenso}`;
}

/** Linha do cartão de pré-visualização: teal quando preenchida, cinza enquanto vazia. */
function linhaPreview(Icone: LucideIcon, valor: string, placeholder: string) {
  const preenchida = valor.trim().length > 0;
  return (
    <div className={`flex items-center gap-2 text-[13px] ${preenchida ? "font-medium text-primary" : "text-faint"}`}>
      <Icone className="size-3.5 shrink-0" />
      <span className="truncate">{preenchida ? valor : placeholder}</span>
    </div>
  );
}

export function AddVistoriaPage({ account, company, vistoria, onCancel, onAgendada }: AddVistoriaPageProps) {
  const empresaHandle = company?.empresaHandle ?? null;
  const ehDono = company != null && !company.isEmployee;

  const [editMode, setEditMode] = useState(!vistoria);

  const [tipo, setTipo] = useState<TipoVistoria>("Entrada");
  const [data, setData] = useState(amanhaISO);
  const [horario, setHorario] = useState("10:00");
  const [duracaoMinutos, setDuracaoMinutos] = useState(60);
  const [endereco, setEndereco] = useState("");
  const [bairroCidade, setBairroCidade] = useState("");
  const [cliente, setCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [keyVistoriador, setKeyVistoriador] = useState("");

  useEffect(() => {
    if (vistoria) {
      setTipo(vistoria.tipo);
      setData(vistoria.data);
      setHorario(vistoria.horario);
      setDuracaoMinutos(vistoria.duracaoMinutos);
      setEndereco(vistoria.endereco);
      setBairroCidade(vistoria.bairroCidade);
      setCliente(vistoria.cliente);
      setObservacoes(vistoria.observacoes || "");
      setKeyVistoriador(vistoria.vistoriador.keyPublica);
      setEditMode(false);
    } else {
      setTipo("Entrada");
      setData(amanhaISO());
      setHorario("10:00");
      setDuracaoMinutos(60);
      setEndereco("");
      setBairroCidade("");
      setCliente("");
      setObservacoes("");
      setKeyVistoriador(account?.keyPublica ?? "");
      setEditMode(true);
    }
  }, [vistoria, account?.keyPublica]);

  const [time, setTime] = useState<OpcaoVistoriador[]>([]);
  const [erroTime, setErroTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Só o dono consegue listar o time; funcionário agenda apenas para si mesmo.
  useEffect(() => {
    if (empresaHandle == null || !ehDono) return;
    listarFuncionarios(empresaHandle)
      .then(funcionarios =>
        setTime(
          funcionarios
            .filter(f => f.status === "Aceito")
            .map(f => ({
              keyPublica: f.keyPublica,
              nome: [f.nome, f.sobrenome].filter(Boolean).join(" "),
            })),
        ),
      )
      .catch(() => setErroTime("Não foi possível carregar o time — você ainda pode agendar para si."));
  }, [empresaHandle, ehDono]);

  const vistoriadores = useMemo<OpcaoVistoriador[]>(() => {
    const eu: OpcaoVistoriador[] = account
      ? [{ keyPublica: account.keyPublica, nome: `${account.name} (você)`, cor: account.color }]
      : [];
    return [...eu, ...time.filter(v => v.keyPublica !== account?.keyPublica)];
  }, [account, time]);

  const tipoAtual = TIPOS.find(t => t.valor === tipo) ?? TIPOS[0];
  const duracaoAtual = DURACOES.find(d => d.minutos === duracaoMinutos) ?? DURACOES[0];
  const vistoriadorAtual = vistoriadores.find(v => v.keyPublica === keyVistoriador);

  const limparAvisos = () => {
    setError("");
    setSuccess("");
  };

  const handleAgendar = async () => {
    limparAvisos();

    if (empresaHandle == null) {
      setError("Empresa inválida");
      return;
    }
    if (!data || !horario) {
      setError("Informe a data e o horário da vistoria");
      return;
    }
    if (!endereco.trim() || !bairroCidade.trim() || !cliente.trim()) {
      setError("Preencha endereço, bairro e cidade e cliente");
      return;
    }
    if (!keyVistoriador) {
      setError("Escolha o vistoriador responsável");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tipo,
        data,
        horario,
        duracaoMinutos,
        endereco: endereco.trim(),
        bairroCidade: bairroCidade.trim(),
        cliente: cliente.trim(),
        keyPublicaVistoriador: keyVistoriador,
        observacoes: observacoes.trim() || null,
      };

      let resVistoria: Vistoria;
      if (vistoria) {
        resVistoria = await atualizarVistoria(empresaHandle, vistoria.handle, payload);
        setSuccess(`Vistoria atualizada para ${rotuloData(resVistoria.data)} às ${resVistoria.horario}.`);
        setEditMode(false);
      } else {
        resVistoria = await agendarVistoria(empresaHandle, payload);
        setSuccess(`Vistoria agendada para ${rotuloData(resVistoria.data)} às ${resVistoria.horario}.`);
        setEndereco("");
        setBairroCidade("");
        setCliente("");
        setObservacoes("");
      }
      onAgendada?.(resVistoria);
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "Erro ao salvar vistoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <Breadcrumb className="mb-2">
          <BreadcrumbList className="text-[13px]">
            <BreadcrumbItem>Vistorias</BreadcrumbItem>
            <BreadcrumbSeparator className="[&>svg]:size-3 [&>svg]:text-faint" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">Nova vistoria</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
          {vistoria ? "Detalhes da vistoria" : "Adicionar vistoria"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {vistoria ? "Consulte ou edite as informações desta vistoria." : "Agende uma nova vistoria e atribua a um membro do time."}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="gap-5 p-5">
          <div className="flex justify-end gap-2">
            {!editMode ? (
              <>
                <Button variant="outline" className="h-10" onClick={onCancel}>
                  Voltar
                </Button>
                <Button className="h-10" onClick={() => setEditMode(true)}>
                  Editar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    if (vistoria) {
                      setEditMode(false);
                      // Reset values to original
                      setTipo(vistoria.tipo);
                      setData(vistoria.data);
                      setHorario(vistoria.horario);
                      setDuracaoMinutos(vistoria.duracaoMinutos);
                      setEndereco(vistoria.endereco);
                      setBairroCidade(vistoria.bairroCidade);
                      setCliente(vistoria.cliente);
                      setObservacoes(vistoria.observacoes || "");
                      setKeyVistoriador(vistoria.vistoriador.keyPublica);
                      limparAvisos();
                    } else {
                      onCancel?.();
                    }
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button className="h-10" onClick={handleAgendar} disabled={loading}>
                  {loading ? <LoaderCircle className="animate-spin" /> : <Check />}
                  {vistoria ? "Salvar" : "Agendar vistoria"}
                </Button>
              </>
            )}
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label className={LABEL_CLASS}>Tipo de vistoria</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              value={tipo}
              onValueChange={valor => { if (valor) { setTipo(valor as TipoVistoria); limparAvisos(); } }}
              className="grid w-full grid-cols-2 lg:grid-cols-4"
              disabled={!editMode}
            >
              {TIPOS.map(opcao => (
                <ToggleGroupItem
                  key={opcao.valor}
                  value={opcao.valor}
                  className={`${CARD_ITEM_CLASS} flex-col items-start gap-2`}
                >
                  <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-faint transition-colors group-data-[state=on]:bg-primary group-data-[state=on]:text-primary-foreground">
                    <opcao.icone className="size-4" />
                  </span>
                  <span className="grid gap-0.5">
                    <span className="text-[13px] leading-tight font-semibold">{opcao.label}</span>
                    <span className="text-[11.5px] leading-tight font-normal text-muted-foreground">
                      {opcao.descricao}
                    </span>
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="vistoria-data" className={LABEL_CLASS}>Data</Label>
              <Input
                id="vistoria-data"
                type="date"
                className="h-10"
                value={data}
                onChange={e => { setData(e.target.value); limparAvisos(); }}
                disabled={!editMode}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vistoria-horario" className={LABEL_CLASS}>Horário</Label>
              <Input
                id="vistoria-horario"
                type="time"
                className="h-10"
                value={horario}
                onChange={e => { setHorario(e.target.value); limparAvisos(); }}
                disabled={!editMode}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className={LABEL_CLASS}>Duração estimada</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              value={String(duracaoMinutos)}
              onValueChange={valor => { if (valor) { setDuracaoMinutos(Number(valor)); limparAvisos(); } }}
              className="grid w-full grid-cols-4"
              disabled={!editMode}
            >
              {DURACOES.map(opcao => (
                <ToggleGroupItem
                  key={opcao.minutos}
                  value={String(opcao.minutos)}
                  className="h-10 rounded-lg border-border text-[13px] font-semibold data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground"
                >
                  {opcao.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="vistoria-endereco" className={LABEL_CLASS}>Endereço do imóvel</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
              <Input
                id="vistoria-endereco"
                className="h-10 pl-9"
                placeholder="Ex.: Rua Augusta, 1500 — Apto 504"
                value={endereco}
                onChange={e => { setEndereco(e.target.value); limparAvisos(); }}
                disabled={!editMode}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="vistoria-bairro" className={LABEL_CLASS}>Bairro e cidade</Label>
              <Input
                id="vistoria-bairro"
                className="h-10"
                placeholder="Consolação, São Paulo"
                value={bairroCidade}
                onChange={e => { setBairroCidade(e.target.value); limparAvisos(); }}
                disabled={!editMode}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vistoria-cliente" className={LABEL_CLASS}>Cliente / imobiliária</Label>
              <Input
                id="vistoria-cliente"
                className="h-10"
                placeholder="Ex.: Lopes Consultoria"
                value={cliente}
                onChange={e => { setCliente(e.target.value); limparAvisos(); }}
                disabled={!editMode}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className={LABEL_CLASS}>Vistoriador responsável</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              value={keyVistoriador}
              onValueChange={valor => { if (valor) { setKeyVistoriador(valor); limparAvisos(); } }}
              className="flex w-full flex-wrap justify-start"
              disabled={!editMode}
            >
              {vistoriadores.map(vistoriador => (
                <ToggleGroupItem
                  key={vistoriador.keyPublica}
                  value={vistoriador.keyPublica}
                  className={`${CARD_ITEM_CLASS} h-11 flex-row items-center gap-2.5 py-2 pr-4`}
                >
                  <Avatar className="size-7">
                    <AvatarFallback
                      className="text-[11px] font-semibold text-white"
                      style={gradienteAvatar(vistoriador.cor)}
                    >
                      {iniciais(vistoriador.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[13px] font-semibold">{vistoriador.nome}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {erroTime && <p className="text-xs text-muted-foreground">{erroTime}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="vistoria-observacoes" className={LABEL_CLASS}>
              Observações <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="vistoria-observacoes"
              className="min-h-24"
              placeholder="Detalhes para o vistoriador, código de acesso, contato do porteiro..."
              value={observacoes}
              onChange={e => { setObservacoes(e.target.value); limparAvisos(); }}
              disabled={!editMode}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2.5">
              <TriangleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500/30 py-2.5 text-green-700 dark:text-green-500 [&>svg]:text-current">
              <CircleCheck />
              <AlertDescription className="text-green-700 dark:text-green-500">{success}</AlertDescription>
            </Alert>
          )}
        </Card>

        <div className="grid gap-4">
          <Card className="gap-0 p-5">
            <div className="text-[11px] font-semibold tracking-[0.08em] text-faint uppercase">
              Pré-visualização
            </div>

            <div className="mt-3.5 flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-md bg-teal-50 text-primary dark:bg-teal-500/15">
                <tipoAtual.icone className="size-4" />
              </span>
              <div>
                <div className="text-[13.5px] leading-tight font-bold">{tipoAtual.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{tipoAtual.descricao}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5">
              {linhaPreview(CalendarDays, rotuloData(data), "Escolha a data…")}
              {linhaPreview(Clock, horario ? `${horario} · ${duracaoAtual.label}` : "", "Escolha o horário…")}
              {linhaPreview(MapPin, endereco, "Endereço…")}
              {linhaPreview(Users, cliente, "Cliente…")}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center gap-2.5">
              <Avatar className="size-9">
                <AvatarFallback
                  className="text-[13px] font-semibold text-white"
                  style={gradienteAvatar(vistoriadorAtual?.cor)}
                >
                  {iniciais(vistoriadorAtual?.nome)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-[11px] leading-tight text-muted-foreground">Atribuído a</div>
                <div className="mt-0.5 text-[13px] leading-tight font-semibold">
                  {vistoriadorAtual?.nome ?? "Ninguém ainda"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="gap-0 border-teal-200/70 bg-teal-50 p-4 shadow-none dark:border-teal-500/25 dark:bg-teal-500/10">
            <div className="flex gap-2.5 text-[13px] leading-normal text-teal-800 dark:text-teal-200">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p>
                <strong className="font-semibold">Dica:</strong> arraste o evento no calendário para
                reagendar rapidamente sem abrir o formulário.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
