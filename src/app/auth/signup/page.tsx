"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, CheckCircle } from "lucide-react";
import { registerUser } from "@/lib/actions/register";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const result = await registerUser({ name, email, password });

            if (result.success) {
                setSuccess(true);
                // Redirect to signin after 2 seconds
                setTimeout(() => {
                    router.push("/auth/signin");
                }, 2000);
            } else {
                setError(result.error.message);
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
                    <CardHeader className="text-center">
                        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                        <CardTitle className="text-white">Account Created!</CardTitle>
                        <CardDescription className="text-slate-400">
                            Your account has been created successfully. Redirecting to sign in...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
                <CardHeader className="text-center">
                    <div className="inline-flex items-center justify-center gap-2 mb-4">
                        <Shield className="h-8 w-8 text-blue-400" />
                        <span className="text-2xl font-bold text-white">DigiNode</span>
                    </div>
                    <CardTitle className="text-white">Create Account</CardTitle>
                    <CardDescription className="text-slate-400">
                        Sign up to start creating mind maps
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-200">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                        </div>
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
                                minLength={8}
                                disabled={isLoading}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                            <p className="text-xs text-slate-500">Must be at least 8 characters</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-slate-400">
                        Already have an account?{" "}
                        <Link href="/auth/signin" className="text-blue-400 hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
