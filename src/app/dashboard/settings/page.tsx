/**
 * Settings Page
 * 
 * User settings and preferences.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { User, Bell, Palette, LogOut } from "lucide-react";

export default async function SettingsPage() {
    const session = await auth();

    return (
        <div className="p-8 max-w-3xl">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500 mt-1">Manage your account and preferences</p>
            </div>

            {/* Profile Section */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-slate-500" />
                        <CardTitle>Profile</CardTitle>
                    </div>
                    <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Name</label>
                        <p className="text-slate-900">{session?.user?.name || "Not set"}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <p className="text-slate-900">{session?.user?.email}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Palette className="h-5 w-5 text-slate-500" />
                        <CardTitle>Preferences</CardTitle>
                    </div>
                    <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500">Theme and preference settings coming soon...</p>
                </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-slate-500" />
                        <CardTitle>Notifications</CardTitle>
                    </div>
                    <CardDescription>Manage notification preferences</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500">Notification settings coming soon...</p>
                </CardContent>
            </Card>

            {/* Sign Out */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <LogOut className="h-5 w-5 text-red-500" />
                        <CardTitle className="text-red-600">Sign Out</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action="/api/auth/signout" method="POST">
                        <Button type="submit" variant="destructive">
                            Sign Out
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
