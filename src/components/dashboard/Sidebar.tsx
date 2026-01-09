"use client";

/**
 * Dashboard Sidebar Component
 * 
 * Navigation sidebar for the dashboard with:
 * - My Maps
 * - Shared with Me
 * - Teams
 * - Settings
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Map,
    Share2,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    {
        label: "My Maps",
        href: "/dashboard",
        icon: Map,
    },
    {
        label: "Shared with Me",
        href: "/dashboard/shared",
        icon: Share2,
    },
    {
        label: "Teams",
        href: "/dashboard/teams",
        icon: Users,
    },
    {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

interface SidebarProps {
    userEmail?: string;
    userName?: string;
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
                {!isCollapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Map className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-lg">DigiNode</span>
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="shrink-0"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 shrink-0",
                                isActive ? "text-blue-600" : "text-slate-400"
                            )} />
                            {!isCollapsed && (
                                <span className="font-medium">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="border-t border-slate-200 p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 transition-colors outline-none",
                            isCollapsed && "justify-center"
                        )}>
                            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                                {userName?.charAt(0)?.toUpperCase() || userEmail?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            {!isCollapsed && (
                                <>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {userName || "User"}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {userEmail}
                                        </p>
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                                </>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56" side="right" sideOffset={10}>
                        <DropdownMenuItem className="gap-2" onClick={() => signOut({ callbackUrl: "/" })}>
                            <LogOut className="h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
