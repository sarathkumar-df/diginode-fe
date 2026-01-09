"use client";

/**
 * Dashboard Sidebar Component - Compact Light Theme with Logo
 */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Map,
    Share2,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
    { label: "My Maps", href: "/dashboard", icon: Map },
    { label: "Shared with Me", href: "/dashboard/shared", icon: Share2 },
    { label: "Teams", href: "/dashboard/teams", icon: Users },
];

const otherNavItems: NavItem[] = [
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
    userEmail?: string;
    userName?: string;
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const NavLink = ({ item }: { item: NavItem }) => {
        const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200",
                    isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
            >
                <item.icon className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-blue-600" : "text-slate-400"
                )} />
                {!isCollapsed && <span>{item.label}</span>}
            </Link>
        );
    };

    return (
        <aside
            className={cn(
                "flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300",
                isCollapsed ? "w-14" : "w-56"
            )}
        >
            {/* Logo Header */}
            <div className="flex items-center justify-between h-12 px-3 border-b border-slate-100">
                {!isCollapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="DigiNode"
                            width={28}
                            height={28}
                            className="rounded-md"
                        />
                        <span className="font-semibold text-sm text-slate-900">DigiNode</span>
                    </Link>
                )}
                {isCollapsed && (
                    <div className="mx-auto">
                        <Image
                            src="/logo.png"
                            alt="DigiNode"
                            width={28}
                            height={28}
                            className="rounded-md"
                        />
                    </div>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-2 py-3 space-y-4">
                <div className="space-y-0.5">
                    {!isCollapsed && (
                        <p className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Workspace
                        </p>
                    )}
                    {mainNavItems.map((item) => (
                        <NavLink key={item.href} item={item} />
                    ))}
                </div>

                <div className="space-y-0.5">
                    {!isCollapsed && (
                        <p className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Other
                        </p>
                    )}
                    {otherNavItems.map((item) => (
                        <NavLink key={item.href} item={item} />
                    ))}
                </div>
            </nav>

            {/* Collapse Toggle */}
            <div className="px-2 pb-1">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <>
                            <ChevronLeft className="h-3.5 w-3.5" />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>

            {/* User Section */}
            <div className="border-t border-slate-100 p-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "flex items-center gap-2 w-full p-1.5 rounded-lg hover:bg-slate-50 transition-all duration-200 outline-none",
                            isCollapsed && "justify-center"
                        )}>
                            <div className="relative">
                                <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs">
                                    {userName?.charAt(0)?.toUpperCase() || userEmail?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></div>
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-medium text-slate-900 truncate">
                                        {userName || "User"}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        {userEmail}
                                    </p>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56"
                        side="right"
                        sideOffset={8}
                    >
                        <div className="px-2 py-2 border-b border-slate-100">
                            <p className="text-sm font-medium text-slate-900">{userName || "User"}</p>
                            <p className="text-xs text-slate-500">{userEmail}</p>
                        </div>
                        <div className="p-1">
                            <DropdownMenuItem className="gap-2 py-1.5 text-sm cursor-pointer rounded">
                                <Bell className="h-3.5 w-3.5" />
                                <span>Notifications</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 py-1.5 text-sm cursor-pointer rounded" asChild>
                                <Link href="/dashboard/settings">
                                    <Settings className="h-3.5 w-3.5" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator />
                        <div className="p-1">
                            <DropdownMenuItem
                                className="gap-2 py-1.5 text-sm text-red-600 focus:text-red-600 cursor-pointer rounded"
                                onClick={() => signOut({ callbackUrl: "/" })}
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
