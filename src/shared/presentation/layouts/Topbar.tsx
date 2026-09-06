import { Bell, House, Moon, Search, Sun } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTheme } from '@/shared/presentation/hooks/useTheme';

export interface TopbarProps {
  title: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  dateLabel?: string;
}

function formatDateLabel(date: Date) {
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${weekday}, ${date.getDate()} ${month}`;
}

export function Topbar({
  title,
  searchPlaceholder = "Buscar vistorias, clientes...",
  onSearch,
  notificationCount = 0,
  onOpenNotifications,
  dateLabel,
}: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-2 text-muted-foreground" />
        <Separator orientation="vertical" className="mr-1 !h-4" />
        <Breadcrumb>
          <BreadcrumbList className="gap-1.5 text-[13px] sm:gap-1.5">
            <BreadcrumbItem>
              <House className="size-3.5 text-faint" />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="[&>svg]:size-3 [&>svg]:text-faint" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden w-[260px] md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            onChange={e => onSearch?.(e.target.value)}
            className="h-9 border-transparent bg-secondary pl-8 text-[13px] shadow-none focus-visible:bg-card md:text-[13px]"
          />
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          onClick={onOpenNotifications}
          title="Notificações"
        >
          <Bell />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 size-[7px] rounded-full border-[1.5px] border-background bg-orange-500" />
          )}
        </Button>

        <span className="hidden pl-1 text-xs whitespace-nowrap text-muted-foreground lg:inline">
          {dateLabel ?? formatDateLabel(new Date())}
        </span>
      </div>
    </header>
  );
}
