import { useState } from 'react';
import { Building2, Check, CircleCheck, Inbox, LoaderCircle, TriangleAlert, X } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useConvitesPendentes } from '../application/useConvitesPendentes';
import type { ConvitePendente } from '../domain/empresa';

export function ConvitesPendentesPage() {
  const { convites, loading, error, successMessage, actionLoadingHandle, responderConvite } = useConvitesPendentes();
  const [convitePararRecusar, setConvitePararRecusar] = useState<ConvitePendente | null>(null);

  const recusaEmAndamento = convitePararRecusar != null && actionLoadingHandle === convitePararRecusar.handle;

  async function confirmarRecusa() {
    if (!convitePararRecusar) return;
    await responderConvite(convitePararRecusar, "recusar");
    setConvitePararRecusar(null);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1 font-serif text-[38px] leading-[1.1] font-normal tracking-[-0.01em]">
          Convites pendentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Empresas que te convidaram para fazer parte da equipe.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-3 py-2.5">
          <TriangleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="mb-3 border-green-500/30 py-2.5 text-green-700 dark:text-green-500 [&>svg]:text-current">
          <CircleCheck />
          <AlertDescription className="text-green-700 dark:text-green-500">{successMessage}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="grid gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!loading && convites.length === 0 && (
        <Card className="gap-0 p-0">
          <div className="px-5 py-12 text-center text-faint">
            <Inbox className="mx-auto mb-2.5 size-[26px]" />
            <div className="mb-1 text-sm font-semibold text-foreground">Nenhum convite pendente</div>
            <div className="text-[13px]">Quando uma empresa te convidar, o convite aparece aqui.</div>
          </div>
        </Card>
      )}

      {!loading && convites.length > 0 && (
        <div className="grid gap-3">
          {convites.map(convite => {
            const carregando = actionLoadingHandle === convite.handle;
            return (
              <Card key={convite.handle} className="flex-row items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <Building2 className="size-[18px]" />
                  </div>
                  <div>
                    <div className="text-[14px] leading-tight font-semibold">{convite.empresaNome}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Convite para fazer parte da equipe</div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={carregando}
                    onClick={() => setConvitePararRecusar(convite)}
                  >
                    <X />
                    Recusar
                  </Button>
                  <Button
                    size="sm"
                    disabled={carregando}
                    onClick={() => responderConvite(convite, "aceitar")}
                  >
                    {carregando ? <LoaderCircle className="animate-spin" /> : <Check />}
                    Aceitar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={convitePararRecusar != null}
        onOpenChange={open => { if (!open && !recusaEmAndamento) setConvitePararRecusar(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              O convite de {convitePararRecusar?.empresaNome} será recusado e você não fará parte da equipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={recusaEmAndamento}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={recusaEmAndamento}
              onClick={e => { e.preventDefault(); confirmarRecusa(); }}
            >
              {recusaEmAndamento ? "Aguarde…" : "Recusar convite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
