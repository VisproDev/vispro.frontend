import { useState } from 'react';
import { SignupPage } from '@/features/auth/presentation/SignupPage';
import { LoginPage } from '@/features/auth/presentation/LoginPage';
import type { ContaAutenticada } from '@/features/auth/domain/conta';
import { CreateCompanyPage } from '@/features/empresas/presentation/CreateCompanyPage';
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import { AddEmployeesPage } from '@/features/empresas/presentation/AddEmployeesPage';
import { FuncionariosPage } from '@/features/empresas/presentation/FuncionariosPage';
import { AddFuncionarioPage } from '@/features/empresas/presentation/AddFuncionarioPage';
import { DashboardPage } from '@/features/dashboard/presentation/DashboardPage';
import { AppShell } from '@/shared/presentation/layouts';
import { clearToken } from '@/shared/infrastructure/storage/token-storage';

type Stage = "signup" | "login" | "create-company" | "add-employees" | "app";
type View = "dashboard" | "funcionarios" | "novo-funcionario";

const VIEW_TITLES: Record<View, string> = {
  dashboard: "Dashboard",
  funcionarios: "Funcionários",
  "novo-funcionario": "Adicionar funcionário",
};

function App() {
  const [stage, setStage] = useState<Stage>("signup");
  const [view, setView] = useState<View>("dashboard");
  const [account, setAccount] = useState<ContaAutenticada | null>(null);
  const [company, setCompany] = useState<CompanyResult | null>(null);

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

  const handleLogout = () => {
    clearToken();
    setAccount(null);
    setCompany(null);
    setStage("login");
  };

  if (stage === "signup") {
    return <SignupPage onComplete={handleAccountCreated} onNavigateToLogin={() => setStage("login")} />;
  }

  if (stage === "login") {
    return <LoginPage onComplete={handleLoggedIn} onNavigateToSignup={() => setStage("signup")} />;
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
    if (key === "dashboard" || key === "funcionarios" || key === "novo-funcionario") {
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
    </AppShell>
  );
}

export default App;
