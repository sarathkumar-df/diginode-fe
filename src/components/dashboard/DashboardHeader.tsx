"use client";

/**
 * Dashboard Header Component
 * 
 * Top header bar with notification bell and user-related actions.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Users, Share2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    listNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    type Notification
} from "@/lib/actions/notification";
import { toast } from "sonner";

export function DashboardHeader() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    // Also fetch on mount for badge count
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const result = await listNotifications();
            if (result.success) {
                setNotifications(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "team_invite": return <Users className="h-4 w-4 text-blue-500" />;
            case "map_shared": return <Share2 className="h-4 w-4 text-green-500" />;
            default: return <MessageSquare className="h-4 w-4 text-slate-500" />;
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-end px-6 shrink-0">
            <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative h-9 w-9">
                            <Bell className="h-5 w-5 text-slate-500" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                            <span className="font-semibold text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={handleMarkAllAsRead}
                                >
                                    <CheckCheck className="h-3 w-3" />
                                    Mark all read
                                </Button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {isLoading ? (
                                <div className="py-8 text-center text-sm text-slate-500">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-500">
                                    <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notification.isRead ? "bg-blue-50/50" : ""
                                            }`}
                                        onClick={() => {
                                            if (!notification.isRead) {
                                                handleMarkAsRead(notification.id);
                                            }
                                            // Navigate based on reference type
                                            if (notification.referenceType === "team" && notification.referenceId) {
                                                router.push(`/dashboard/teams/${notification.referenceId}`);
                                                setOpen(false);
                                            } else if (notification.referenceType === "map" && notification.referenceId) {
                                                router.push(`/editor/${notification.referenceId}`);
                                                setOpen(false);
                                            }
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            <div className="shrink-0 mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.isRead ? "font-medium" : ""}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {formatTime(notification.createdAt)}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
