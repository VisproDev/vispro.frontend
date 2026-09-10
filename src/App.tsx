import { useEffect, useState } from 'react';
import { SignupPage } from '@/features/auth/presentation/SignupPage';
import { LoginPage } from '@/features/auth/presentation/LoginPage';
import type { ContaAutenticada } from '@/features/auth/domain/conta';
import type { PerfilUsuario } from '@/features/auth/domain/perfil';
import { CreateCompanyPage } from '@/features/empresas/presentation/CreateCompanyPage';
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import { AddEmployeesPage } from '@/features/empresas/presentation/AddEmployeesPage';
import { FuncionariosPage } from '@/features/empresas/presentation/FuncionariosPage';
import { AddFuncionarioPage } from '@/features/empresas/presentation/AddFuncionarioPage';
import { DashboardPage } from '@/features/dashboard/presentation/DashboardPage';
import { AddVistoriaPage } from '@/features/vistorias/presentation/AddVistoriaPage';
import { VistoriasPage } from '@/features/vistorias/presentation/VistoriasPage';
import type { Vistoria } from '@/features/vistorias/domain/vistoria';
import { AddProprietarioPage } from '@/features/proprietarios/presentation/AddProprietarioPage';
import { ProprietariosPage } from '@/features/proprietarios/presentation/ProprietariosPage';
import { AddInquilinoPage } from '@/features/inquilinos/presentation/AddInquilinoPage';
import { InquilinosPage } from '@/features/inquilinos/presentation/InquilinosPage';
import { AppShell } from '@/shared/presentation/layouts';
import {
  encerrarSessao,
  renovarSessaoSeNecessario,
  restaurarSessao,
  setSessaoExpiradaCallback,
} from '@/features/auth/application/sessao';
import { useSessionLifecycle } from '@/shared/presentation/hooks/useSessionLifecycle';

type Stage = "bootstrapping" | "signup" | "login" | "create-company" | "add-employees" | "app";
type View =
  | "dashboard"
  | "funcionarios"
  | "novo-funcionario"
  | "vistorias"
  | "nova-vistoria"
  | "proprietarios"
  | "novo-proprietario"
  | "inquilinos"
  | "novo-inquilino";

/** Mesma conversão feita em LoginPage.tsx ao autenticar — reaproveitada aqui para reconstruir a
 *  sessão da UI (conta + empresa) a partir do perfil devolvido por restaurarSessao(). */
function perfilParaContaEEmpresa(usuario: PerfilUsuario): { account: ContaAutenticada; company: CompanyResult } {
  return {
    account: {
      handle: usuario.handle,
      keyPublica: usuario.keyPublica,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      email: usuario.email,
      name: `${usuario.nome} ${usuario.sobrenome}`.trim(),
      color: "#0D9488",
      key: usuario.keyPublica,
    },
    company: {
      isEmployee: usuario.empresaDona == null,
      companyName: usuario.empresaDona?.nome ?? null,
      empresaHandle: usuario.empresaDona?.handle ?? null,
    },
  };
}

const VIEW_TITLES: Record<View, string> = {
  dashboard: "Dashboard",
  funcionarios: "Funcionários",
  "novo-funcionario": "Adicionar funcionário",
  vistorias: "Vistorias",
  "nova-vistoria": "Nova vistoria",
  proprietarios: "Proprietários",
  "novo-proprietario": "Adicionar proprietário",
  inquilinos: "Inquilinos",
  "novo-inquilino": "Adicionar inquilino",
};

function App() {
  const [stage, setStage] = useState<Stage>("bootstrapping");
  const [view, setView] = useState<View>("dashboard");
  const [account, setAccount] = useState<ContaAutenticada | null>(null);
  const [company, setCompany] = useState<CompanyResult | null>(null);
  const [vistoriaSelecionada, setVistoriaSelecionada] = useState<Vistoria | null>(null);
  const [mensagemLogin, setMensagemLogin] = useState<string | undefined>(undefined);

  // Bootstrap: tenta restaurar a sessão salva antes de decidir entre login e signup — corrige o
  // bug de perder a sessão inteira ao recarregar a página mesmo com um access token válido.
  useEffect(() => {
    let cancelado = false;

    restaurarSessao()
      .then(perfil => {
        if (cancelado) return;
        if (perfil) {
          const { account: acc, company: comp } = perfilParaContaEEmpresa(perfil);
          setAccount(acc);
          setCompany(comp);
          setStage("app");
        } else {
          setStage("signup");
        }
      })
      .catch(() => {
        if (!cancelado) setStage("signup");
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const handleSessionExpired = (mensagem: string) => {
    setAccount(null);
    setCompany(null);
    setMensagemLogin(mensagem);
    setStage("login");
  };

  // registrado uma vez: cobre o 401 vindo do http-client quando o refresh também falha
  useEffect(() => {
    setSessaoExpiradaCallback(() => handleSessionExpired("Sua sessão expirou. Faça login novamente."));
    return () => setSessaoExpiradaCallback(null);
  }, []);

  useSessionLifecycle({
    ativo: stage === "app",
    renovarSessaoSeNecessario,
    onSessionExpired: () => handleSessionExpired("Sua sessão expirou por inatividade"),
  });

  const handleAccountCreated = (acc: ContaAutenticada) => {
    setAccount(acc);
    setStage("create-company");
  };

  const handleLoggedIn = (acc: ContaAutenticada, comp: CompanyResult) => {
    setAccount(acc);
    setCompany(comp);
    setStage("app");
  };

  const handleCompanyCreated = (comp: CompanyResult) => {
    setCompany(comp);
    setStage(comp.isEmployee ? "app" : "add-employees");
  };

  const handleEmployeesAdded = () => {
    setStage("app");
  };

  const handleLogout = async () => {
    await encerrarSessao();
    setAccount(null);
    setCompany(null);
    setMensagemLogin(undefined);
    setStage("login");
  };

  if (stage === "bootstrapping") {
    return (
      <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">
        Carregando sessão…
      </div>
    );
  }

  if (stage === "signup") {
    return <SignupPage onComplete={handleAccountCreated} onNavigateToLogin={() => setStage("login")} />;
  }

  if (stage === "login") {
    return (
      <LoginPage
        onComplete={handleLoggedIn}
        onNavigateToSignup={() => setStage("signup")}
        mensagemInicial={mensagemLogin}
      />
    );
  }

  if (stage === "create-company") {
    return <CreateCompanyPage account={account} onComplete={handleCompanyCreated} onBack={() => setStage("signup")} />;
  }

  if (stage === "add-employees") {
    return (
      <AddEmployeesPage
        companyName={company?.companyName}
        empresaHandle={company?.empresaHandle ?? null}
        onComplete={handleEmployeesAdded}
        onBack={() => setStage("create-company")}
      />
    );
  }

  const workspaceName = company?.isEmployee ? (account?.name?.split(" ")[0] || "Workspace") : (company?.companyName || "Workspace");

  const handleNavigate = (key: string) => {
    if (
      key === "dashboard" ||
      key === "funcionarios" ||
      key === "novo-funcionario" ||
      key === "vistorias" ||
      key === "nova-vistoria" ||
      key === "proprietarios" ||
      key === "novo-proprietario" ||
      key === "inquilinos" ||
      key === "novo-inquilino"
    ) {
      setView(key);
    }
  };

  return (
    <AppShell
      sidebar={{
        workspaceName,
        planLabel: "Plano Free · 5/12 vagas",
        activeItem: view,
        onNavigate: handleNavigate,
        userName: account?.name || "Usuário",
        userRole: company?.isEmployee ? "Funcionário" : "Proprietário",
        userColor: account?.color,
        onLogout: handleLogout,
      }}
      topbar={{ title: VIEW_TITLES[view] }}
    >
      {view === "dashboard" && <DashboardPage account={account} />}

      {view === "funcionarios" && (
        <FuncionariosPage
          account={account}
          company={company}
          onAddFuncionario={() => setView("novo-funcionario")}
        />
      )}

      {view === "novo-funcionario" && (
        <AddFuncionarioPage empresaHandle={company?.empresaHandle ?? null} />
      )}

      {view === "vistorias" && (
        <VistoriasPage
          account={account}
          company={company}
          onNovaVistoria={() => {
            setVistoriaSelecionada(null);
            setView("nova-vistoria");
          }}
          onAbrirVistoria={(vistoria) => {
            setVistoriaSelecionada(vistoria);
            setView("nova-vistoria");
          }}
        />
      )}

      {view === "nova-vistoria" && (
        <AddVistoriaPage
          account={account}
          company={company}
          vistoria={vistoriaSelecionada}
          onCancel={() => {
            setVistoriaSelecionada(null);
            setView("vistorias");
          }}
          onAgendada={() => {
            setVistoriaSelecionada(null);
            setView("vistorias");
          }}
        />
      )}

      {view === "proprietarios" && (
        <ProprietariosPage
          company={company}
          onAddProprietario={() => setView("novo-proprietario")}
        />
      )}

      {view === "novo-proprietario" && (
        <AddProprietarioPage
          company={company}
          onCancel={() => setView("proprietarios")}
          onCriado={() => setView("proprietarios")}
        />
      )}

      {view === "inquilinos" && (
        <InquilinosPage
          company={company}
          onAddInquilino={() => setView("novo-inquilino")}
        />
      )}

      {view === "novo-inquilino" && (
        <AddInquilinoPage
          company={company}
          onCancel={() => setView("inquilinos")}
          onCriado={() => setView("inquilinos")}
        />
      )}
    </AppShell>
  );
}

export default App;
