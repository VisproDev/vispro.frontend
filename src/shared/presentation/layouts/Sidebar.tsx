import {
  Building2,
  CalendarDays,
  ChevronsUpDown,
  ClipboardList,
  ContactRound,
  House,
  LogOut,
  Mail,
  Plus,
  Settings,
  UserPlus,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { gradienteAvatar, iniciais } from '@/shared/presentation/lib/avatar';

export interface SidebarNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

const WORKSPACE_ITEMS: SidebarNavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: House },
  { key: "calendario", label: "Calendário", icon: CalendarDays },
  { key: "vistorias", label: "Vistorias", icon: ClipboardList },
  { key: "imoveis", label: "Imóveis", icon: Building2 },
  { key: "proprietarios", label: "Proprietários", icon: ContactRound },
  { key: "inquilinos", label: "Inquilinos", icon: ContactRound },
  { key: "funcionarios", label: "Funcionários", icon: Users },
  { key: "convites", label: "Convites pendentes", icon: Mail },
];

const QUICK_ACTIONS: SidebarNavItem[] = [
  { key: "nova-vistoria", label: "Adicionar vistoria", icon: Plus },
  { key: "novo-imovel", label: "Adicionar imóvel", icon: Building2 },
  { key: "novo-proprietario", label: "Adicionar proprietário", icon: UserRoundPlus },
  { key: "novo-inquilino", label: "Adicionar inquilino", icon: UserRoundPlus },
  { key: "novo-funcionario", label: "Adicionar funcionário", icon: UserPlus },
];

export interface SidebarProps {
  workspaceName: string;
  planLabel: string;
  activeItem: string;
  onNavigate?: (key: string) => void;
  onOpenSettings?: () => void;
  userName: string;
  userRole: string;
  userColor?: string;
  onLogout?: () => void;
}

/** Item ativo herda o visual do original: superfície branca, sombra leve e ícone em teal. */
const MENU_BUTTON_CLASS =
  "h-[34px] gap-2.5 text-[13.5px] font-medium data-[active=true]:bg-card data-[active=true]:font-semibold data-[active=true]:shadow-sm data-[active=true]:*:[svg]:text-primary";

export function Sidebar({
  workspaceName,
  planLabel,
  activeItem,
  onNavigate,
  onOpenSettings,
  userName,
  userRole,
  userColor,
  onLogout,
}: SidebarProps) {
  return (
    <SidebarRoot collapsible="icon" className="border-r">
      <SidebarHeader className="p-0">
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="brand-mark size-8 font-serif text-[19px] font-medium">V</div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm leading-tight font-bold">{workspaceName}</div>
            <div className="truncate text-[11.5px] text-muted-foreground">{planLabel}</div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-[30px] text-faint group-data-[collapsible=icon]:hidden"
            onClick={onOpenSettings}
            title="Configurações"
          >
            <Settings />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1">
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-px">
              {WORKSPACE_ITEMS.map(item => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={activeItem === item.key}
                    tooltip={item.label}
                    className={MENU_BUTTON_CLASS}
                    onClick={() => onNavigate?.(item.key)}
                  >
                    <item.icon className="text-faint" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.badge !== undefined && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
            Ações rápidas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-px">
              {QUICK_ACTIONS.map(item => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={activeItem === item.key}
                    tooltip={item.label}
                    className={MENU_BUTTON_CLASS}
                    onClick={() => onNavigate?.(item.key)}
                  >
                    <item.icon className="text-faint" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                  aria-label="Menu do usuário"
                >
                  <Avatar className="size-9">
                    <AvatarFallback
                      className="text-[13px] font-semibold text-white"
                      style={gradienteAvatar(userColor)}
                    >
                      {iniciais(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left">
                    <span className="truncate text-[13px] leading-tight font-semibold">{userName}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{userRole}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto text-faint" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={6}
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
              >
                <DropdownMenuItem variant="destructive" onSelect={() => onLogout?.()}>
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  );
}
