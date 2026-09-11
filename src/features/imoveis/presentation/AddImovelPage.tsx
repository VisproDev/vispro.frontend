import { useState } from 'react';
import { Building2, Check, CircleCheck, DoorOpen, LoaderCircle, MapPin, Ruler, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import { TIPOS_IMOVEL, validarEndereco, validarMetragem, validarNumeroComodos, validarTipo } from '../domain/imovel';
import { criarImovel } from '../infrastructure/imoveis-api';
import { ApiRequestError } from '@/shared/infrastructure/http/http-client';

interface AddImovelPageProps {
  company: CompanyResult | null;
  onCancel?: () => void;
  onCriado?: () => void;
}

const LABEL_CLASS = "text-[13px] font-semibold";
const MENSAGEM_SEM_PERMISSAO = "Você não tem permissão para cadastrar imóveis nesta empresa.";

export function AddImovelPage({ company, onCancel, onCriado }: AddImovelPageProps) {
  const empresaHandle = company?.empresaHandle ?? null;

  const [endereco, setEndereco] = useState("");
  const [tipo, setTipo] = useState("");
  const [metragem, setMetragem] = useState("");
  const [numeroComodos, setNumeroComodos] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const limparAvisos = () => {
    setError("");
    setSuccess("");
  };

  const metragemNumero = Number(metragem.replace(",", "."));
  const numeroComodosNumero = Number(numeroComodos);

  const podeSubmeter =
    validarEndereco(endereco) &&
    validarTipo(tipo) &&
    metragem.trim() !== "" &&
    validarMetragem(metragemNumero) &&
    numeroComodos.trim() !== "" &&
    validarNumeroComodos(numeroComodosNumero);

  const handleCriar = async () => {
    limparAvisos();

    if (empresaHandle == null) {
      setError("Empresa inválida");
      return;
    }
    if (!validarEndereco(endereco)) {
      setError("Informe o endereço do imóvel");
      return;
    }
    if (!validarTipo(tipo)) {
      setError("Selecione o tipo do imóvel");
      return;
    }
    if (metragem.trim() === "" || !validarMetragem(metragemNumero)) {
      setError("Informe uma metragem válida, maior que zero");
      return;
    }
    if (numeroComodos.trim() === "" || !validarNumeroComodos(numeroComodosNumero)) {
      setError("Informe um número de cômodos válido, maior que zero");
      return;
    }

    setLoading(true);
    try {
      await criarImovel(empresaHandle, {
        endereco: endereco.trim(),
        tipo,
        metragem: metragemNumero,
        numeroComodos: numeroComodosNumero,
      });
      setSuccess(`Imóvel em ${endereco.trim()} cadastrado com sucesso.`);
      setEndereco("");
      setTipo("");
      setMetragem("");
      setNumeroComodos("");
      onCriado?.();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 403) {
        setError(MENSAGEM_SEM_PERMISSAO);
      } else {
        setError((err instanceof Error ? err.message : "") || "Erro ao cadastrar imóvel");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <Breadcrumb className="mb-2">
          <BreadcrumbList className="text-[13px]">
            <BreadcrumbItem>Imóveis</BreadcrumbItem>
            <BreadcrumbSeparator className="[&>svg]:size-3 [&>svg]:text-faint" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">Novo imóvel</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
          Adicionar imóvel
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastre um imóvel para vincular futuras vistorias, proprietários e inquilinos.
        </p>
      </div>

      <Card className="max-w-2xl gap-5 p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="imovel-endereco" className={LABEL_CLASS}>Endereço</Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              id="imovel-endereco"
              className="h-10 pl-9"
              placeholder="Rua, número, bairro, cidade"
              value={endereco}
              onChange={e => { setEndereco(e.target.value); limparAvisos(); }}
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="imovel-tipo" className={LABEL_CLASS}>Tipo</Label>
            <Select
              value={tipo}
              onValueChange={valor => { setTipo(valor); limparAvisos(); }}
              disabled={loading}
            >
              <SelectTrigger id="imovel-tipo" className="h-10 w-full">
                <Building2 className="size-3.5 text-faint" />
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_IMOVEL.map(opcao => (
                  <SelectItem key={opcao} value={opcao}>{opcao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="imovel-metragem" className={LABEL_CLASS}>Metragem (m²)</Label>
            <div className="relative">
              <Ruler className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
              <Input
                id="imovel-metragem"
                type="number"
                min="0"
                step="0.01"
                className="h-10 pl-9"
                placeholder="75"
                value={metragem}
                onChange={e => { setMetragem(e.target.value); limparAvisos(); }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="imovel-comodos" className={LABEL_CLASS}>Número de cômodos</Label>
            <div className="relative">
              <DoorOpen className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
              <Input
                id="imovel-comodos"
                type="number"
                min="1"
                step="1"
                className="h-10 pl-9"
                placeholder="4"
                value={numeroComodos}
                onChange={e => { setNumeroComodos(e.target.value); limparAvisos(); }}
                disabled={loading}
              />
            </div>
          </div>
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-10" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            className="h-10"
            onClick={handleCriar}
            disabled={loading || !podeSubmeter}
          >
            {loading ? <LoaderCircle className="animate-spin" /> : <Check />}
            Cadastrar imóvel
          </Button>
        </div>
      </Card>
    </>
  );
}
