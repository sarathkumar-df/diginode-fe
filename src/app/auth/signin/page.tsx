"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicrosoftLogin = () => {
        signIn("microsoft-entra-id", { callbackUrl: "/dashboard" });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
                <CardHeader className="text-center">
                    <div className="inline-flex items-center justify-center gap-2 mb-4">
                        <Shield className="h-8 w-8 text-blue-400" />
                        <span className="text-2xl font-bold text-white">DigiNode</span>
                    </div>
                    <CardTitle className="text-white">Sign In</CardTitle>
                    <CardDescription className="text-slate-400">
                        Sign in to access your mind maps
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Email/Password Form */}
                    <form onSubmit={handleCredentialsLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-200">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-400">{error}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-600" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
                        </div>
                    </div>

                    {/* Microsoft SSO */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
                        onClick={handleMicrosoftLogin}
                    >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="none">
                            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                        </svg>
                        Sign in with Microsoft
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-slate-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/signup" className="text-blue-400 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
