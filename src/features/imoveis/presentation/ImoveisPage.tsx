import { useEffect, useState } from 'react';
import { Building2, Plus, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import type { Imovel } from '../domain/imovel';
import { listarImoveis } from '../infrastructure/imoveis-api';

interface ImoveisPageProps {
  company: CompanyResult | null;
  onAddImovel: () => void;
}

const TH_CLASS = "h-auto bg-secondary px-5 py-3 text-[11px] font-semibold tracking-[0.06em] text-faint uppercase";
const TD_CLASS = "px-5 py-3.5 text-[13.5px]";

export function ImoveisPage({ company, onAddImovel }: ImoveisPageProps) {
  const empresaHandle = company?.empresaHandle ?? null;

  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(empresaHandle != null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (empresaHandle == null) return;

    let ativo = true;
    setLoading(true);
    setError("");

    listarImoveis(empresaHandle)
      .then(dados => { if (ativo) setImoveis(dados); })
      .catch(err => {
        if (ativo) setError((err instanceof Error ? err.message : "") || "Erro ao carregar imóveis");
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
            Imóveis
          </h1>
          <p className="text-sm text-muted-foreground">
            {imoveis.length} {imoveis.length === 1 ? "imóvel cadastrado" : "imóveis cadastrados"}
          </p>
        </div>
        <Button onClick={onAddImovel}>
          <Plus />
          Adicionar imóvel
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
              <TableHead className={TH_CLASS}>Endereço</TableHead>
              <TableHead className={TH_CLASS}>Tipo</TableHead>
              <TableHead className={TH_CLASS}>Metragem</TableHead>
              <TableHead className={TH_CLASS}>Cômodos</TableHead>
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

            {!carregando && imoveis.map(imovel => (
              <TableRow key={imovel.handle}>
                <TableCell className={TD_CLASS}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-full bg-secondary">
                      <Building2 className="size-4 text-faint" />
                    </div>
                    <span className="text-[13.5px] font-semibold">{imovel.endereco}</span>
                  </div>
                </TableCell>
                <TableCell className={`${TD_CLASS} text-muted-foreground`}>{imovel.tipo}</TableCell>
                <TableCell className={`${TD_CLASS} text-muted-foreground`}>
                  {imovel.metragem.toLocaleString("pt-BR")} m²
                </TableCell>
                <TableCell className={`${TD_CLASS} text-muted-foreground`}>{imovel.numeroComodos}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!carregando && imoveis.length === 0 && (
          <div className="px-5 py-12 text-center text-faint">
            <Building2 className="mx-auto mb-2.5 size-[26px]" />
            <div className="mb-1 text-sm font-semibold text-foreground">Nenhum imóvel ainda</div>
            <div className="text-[13px]">Cadastre um imóvel para começar.</div>
          </div>
        )}
      </Card>
    </>
  );
}
