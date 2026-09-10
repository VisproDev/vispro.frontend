import { useEffect, useState } from 'react';
import { ContactRound, Plus, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import { formatarDocumento, type Proprietario } from '../domain/proprietario';
import { listarProprietarios } from '../infrastructure/proprietarios-api';

interface ProprietariosPageProps {
  company: CompanyResult | null;
  onAddProprietario: () => void;
}

const TH_CLASS = "h-auto bg-secondary px-5 py-3 text-[11px] font-semibold tracking-[0.06em] text-faint uppercase";
const TD_CLASS = "px-5 py-3.5 text-[13.5px]";

export function ProprietariosPage({ company, onAddProprietario }: ProprietariosPageProps) {
  const empresaHandle = company?.empresaHandle ?? null;

  const [proprietarios, setProprietarios] = useState<Proprietario[]>([]);
  const [loading, setLoading] = useState(empresaHandle != null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (empresaHandle == null) return;

    let ativo = true;
    setLoading(true);
    setError("");

    listarProprietarios(empresaHandle)
      .then(dados => { if (ativo) setProprietarios(dados); })
      .catch(err => {
        if (ativo) setError((err instanceof Error ? err.message : "") || "Erro ao carregar proprietários");
      })
      .finally(() => { if (ativo) setLoading(false); });

    return () => { ativo = false; };
  }, [empresaHandle]);

  const carregando = empresaHandle != null && loading;

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
            Proprietários
          </h1>
          <p className="text-sm text-muted-foreground">
            {proprietarios.length} {proprietarios.length === 1 ? "proprietário" : "proprietários"} cadastrados
          </p>
        </div>
        <Button onClick={onAddProprietario}>
          <Plus />
          Adicionar proprietário
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
              <TableHead className={TH_CLASS}>Nome</TableHead>
              <TableHead className={TH_CLASS}>Documento</TableHead>
              <TableHead className={TH_CLASS}>Telefone</TableHead>
              <TableHead className={TH_CLASS}>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carregando &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                  <TableCell className={TD_CLASS} colSpan={4}>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!carregando && proprietarios.map(proprietario => (
              <TableRow key={proprietario.handle}>
                <TableCell className={TD_CLASS}>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-9">
                      <AvatarFallback className="text-[13px] font-semibold text-white" style={gradienteAvatar()}>
                        {iniciais(proprietario.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[13.5px] font-semibold">{proprietario.nome}</span>
                  </div>
                </TableCell>
                <TableCell className={`${TD_CLASS} font-mono text-[12.5px] text-muted-foreground`}>
                  {formatarDocumento(proprietario.documento)}
                </TableCell>
                <TableCell className={`${TD_CLASS} text-muted-foreground`}>
                  {proprietario.telefone || "—"}
                </TableCell>
                <TableCell className={`${TD_CLASS} text-muted-foreground`}>
                  {proprietario.email || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!carregando && proprietarios.length === 0 && (
          <div className="px-5 py-12 text-center text-faint">
            <ContactRound className="mx-auto mb-2.5 size-[26px]" />
            <div className="mb-1 text-sm font-semibold text-foreground">Nenhum proprietário ainda</div>
            <div className="text-[13px]">Cadastre o proprietário de um imóvel para começar.</div>
          </div>
        )}
      </Card>
    </>
  );
}
