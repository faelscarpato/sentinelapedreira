import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BarChart3,
  FileText,
  Scale,
  Building,
  AlertTriangle,
  Users,
  Settings,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { cn } from "../ui/utils";

const navItems = [
  { label: "Início", href: "/", icon: BarChart3 },
  { label: "Documentos", href: "/documents", icon: FileText },
  { label: "Análises", href: "/analyses", icon: BarChart3 },
  { label: "Denúncias", href: "/complaints", icon: AlertTriangle },
  { label: "Assistente Jurídico", href: "/legal-assistant", icon: Scale },
  { label: "Diário Oficial", href: "/diario-oficial", icon: Building },
  { label: "Câmara", href: "/camara", icon: Users },
];

const adminItems = [
  { label: "Painel Admin", href: "/admin-dashboard", icon: BarChart3 },
  { label: "Configurações", href: "/settings", icon: Settings },
];

export function SidebarNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const location = useLocation();

  const items = isAdmin ? [...navItems, ...adminItems] : navItems;

  const SidebarContent = () => (
    <nav className="space-y-2 py-4">
      {items.map(({ label, href, icon: Icon }) => (
        <Link key={href} to={href}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2",
              location.pathname === href && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Button>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background p-4">
        <div className="flex items-center gap-2 px-2 py-6 font-bold text-lg">
          <Building className="h-6 w-6" />
          <span>Sentinela</span>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="outline" size="icon" className="fixed bottom-4 left-4 z-40">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center gap-2 px-6 py-4 font-bold text-lg border-b">
            <Building className="h-6 w-6" />
            <span>Sentinela</span>
          </div>
          <div className="px-4">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
