import { type KeyboardEvent, useState } from 'react';
import { Check, CircleCheck, IdCard, LoaderCircle, Mail, Phone, TriangleAlert, User } from 'lucide-react';
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
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import {
  cursorAposDigito,
  formatarDocumento,
  normalizarDocumento,
  validarDocumento,
  validarEmail,
} from '../domain/proprietario';
import { criarProprietario } from '../infrastructure/proprietarios-api';

interface AddProprietarioPageProps {
  company: CompanyResult | null;
  onCancel?: () => void;
  onCriado?: () => void;
}

const LABEL_CLASS = "text-[13px] font-semibold";

export function AddProprietarioPage({ company, onCancel, onCriado }: AddProprietarioPageProps) {
  const empresaHandle = company?.empresaHandle ?? null;

  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const limparAvisos = () => {
    setError("");
    setSuccess("");
  };

  const documentoValido = documento.trim() === "" || validarDocumento(documento);
  const emailValido = validarEmail(email);

  // Ao apagar um separador da máscara (Backspace/Delete), remove o dígito adjacente em vez de
  // ignorar a tecla — sem isso, apagar "-" em "123.456.789-09" reformata pro mesmo texto.
  const handleDocumentoKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace" && e.key !== "Delete") return;

    const input = e.currentTarget;
    const cursor = input.selectionStart;
    if (cursor == null || input.selectionEnd !== cursor) return;

    const formatado = formatarDocumento(documento);
    const digitos = normalizarDocumento(documento);

    if (e.key === "Backspace" && cursor > 0 && /\D/.test(formatado[cursor - 1])) {
      e.preventDefault();
      const digitIndex = formatado.slice(0, cursor).replace(/\D/g, "").length;
      if (digitIndex === 0) return;
      aplicarNovoDocumento(digitos.slice(0, digitIndex - 1) + digitos.slice(digitIndex), digitIndex - 1, input);
    } else if (e.key === "Delete" && cursor < formatado.length && /\D/.test(formatado[cursor])) {
      e.preventDefault();
      const digitIndex = formatado.slice(0, cursor).replace(/\D/g, "").length;
      aplicarNovoDocumento(digitos.slice(0, digitIndex) + digitos.slice(digitIndex + 1), digitIndex, input);
    }
  };

  const aplicarNovoDocumento = (novosDigitos: string, novoDigitIndex: number, input: HTMLInputElement) => {
    setDocumento(novosDigitos);
    limparAvisos();
    const novoCursor = cursorAposDigito(formatarDocumento(novosDigitos), novoDigitIndex);
    requestAnimationFrame(() => input.setSelectionRange(novoCursor, novoCursor));
  };

  const handleCriar = async () => {
    limparAvisos();

    if (empresaHandle == null) {
      setError("Empresa inválida");
      return;
    }
    if (!nome.trim()) {
      setError("Informe o nome do proprietário");
      return;
    }
    if (!documento.trim()) {
      setError("Informe o CPF ou CNPJ do proprietário");
      return;
    }
    if (!validarDocumento(documento)) {
      setError("Documento inválido — confira o CPF ou CNPJ informado");
      return;
    }
    if (!validarEmail(email)) {
      setError("Email inválido — confira o endereço informado");
      return;
    }

    setLoading(true);
    try {
      await criarProprietario(empresaHandle, {
        nome: nome.trim(),
        documento: normalizarDocumento(documento),
        telefone: telefone.trim() || null,
        email: email.trim() || null,
      });
      setSuccess(`Proprietário ${nome.trim()} cadastrado com sucesso.`);
      setNome("");
      setDocumento("");
      setTelefone("");
      setEmail("");
      onCriado?.();
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "Erro ao cadastrar proprietário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <Breadcrumb className="mb-2">
          <BreadcrumbList className="text-[13px]">
            <BreadcrumbItem>Proprietários</BreadcrumbItem>
            <BreadcrumbSeparator className="[&>svg]:size-3 [&>svg]:text-faint" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">Novo proprietário</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
          Adicionar proprietário
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastre o proprietário de um imóvel para vincular futuras vistorias.
        </p>
      </div>

      <Card className="max-w-2xl gap-5 p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="proprietario-nome" className={LABEL_CLASS}>Nome</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              id="proprietario-nome"
              className="h-10 pl-9"
              placeholder="Nome completo ou razão social"
              value={nome}
              onChange={e => { setNome(e.target.value); limparAvisos(); }}
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="proprietario-documento" className={LABEL_CLASS}>CPF ou CNPJ</Label>
          <div className="relative">
            <IdCard className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              id="proprietario-documento"
              className="h-10 pl-9 font-mono"
              placeholder="000.000.000-00"
              value={formatarDocumento(documento)}
              onChange={e => { setDocumento(e.target.value); limparAvisos(); }}
              onKeyDown={handleDocumentoKeyDown}
              disabled={loading}
              aria-invalid={!documentoValido}
            />
          </div>
          {!documentoValido && (
            <p className="text-xs text-destructive">Documento inválido — confira os dígitos.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="proprietario-telefone" className={LABEL_CLASS}>
              Telefone <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
              <Input
                id="proprietario-telefone"
                className="h-10 pl-9"
                placeholder="(11) 91234-5678"
                value={telefone}
                onChange={e => { setTelefone(e.target.value); limparAvisos(); }}
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="proprietario-email" className={LABEL_CLASS}>
              Email <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
              <Input
                id="proprietario-email"
                type="email"
                className="h-10 pl-9"
                placeholder="proprietario@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); limparAvisos(); }}
                disabled={loading}
                aria-invalid={!emailValido}
              />
            </div>
            {!emailValido && (
              <p className="text-xs text-destructive">Email inválido — confira o endereço informado.</p>
            )}
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
            disabled={loading || !nome.trim() || !documento.trim() || !emailValido}
          >
            {loading ? <LoaderCircle className="animate-spin" /> : <Check />}
            Cadastrar proprietário
          </Button>
        </div>
      </Card>
    </>
  );
}
