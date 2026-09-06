import type { CSSProperties, ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from './Sidebar';
import type { SidebarProps } from './Sidebar';
import { Topbar } from './Topbar';
import type { TopbarProps } from './Topbar';

export interface AppShellProps {
  sidebar: SidebarProps;
  topbar: TopbarProps;
  children: ReactNode;
}

/** Largura da sidebar do design original (248px). */
const SHELL_STYLE = { "--sidebar-width": "248px" } as CSSProperties;

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <SidebarProvider style={SHELL_STYLE} className="h-svh overflow-hidden">
      <Sidebar {...sidebar} />
      <SidebarInset className="h-svh overflow-hidden">
        <Topbar {...topbar} />
        <div className="flex-1 overflow-y-auto px-8 py-7">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
