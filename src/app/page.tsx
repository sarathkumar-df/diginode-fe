"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Network, Shield, Users, Zap, Loader2, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualLogin, setShowManualLogin] = useState(false);

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
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    setIsMicrosoftLoading(true);
    signIn("microsoft-entra-id", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header with Dashboard Link */}
      <header className="container mx-auto px-4 py-4 flex justify-end">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 container mx-auto px-4 flex items-center justify-center py-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full max-w-6xl">
          {/* Left: Hero Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 mb-6">
              <Shield className="h-4 w-4 text-green-400" />
              Enterprise-Grade Security
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                DigiNode
              </span>
            </h1>

            <p className="text-lg text-slate-300 max-w-xl mb-8 leading-relaxed">
              Secure, collaborative mind-mapping built for regulated enterprise environments.
              Powered by Azure AD SSO and pessimistic locking for guaranteed data integrity.
            </p>

            {/* Feature Pills - Compact */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <div className="flex items-center gap-2 bg-slate-800/30 px-3 py-1.5 rounded-full text-sm text-slate-400">
                <Network className="h-4 w-4 text-blue-400" />
                Mind Mapping
              </div>
              <div className="flex items-center gap-2 bg-slate-800/30 px-3 py-1.5 rounded-full text-sm text-slate-400">
                <Users className="h-4 w-4 text-purple-400" />
                Collaboration
              </div>
              <div className="flex items-center gap-2 bg-slate-800/30 px-3 py-1.5 rounded-full text-sm text-slate-400">
                <Zap className="h-4 w-4 text-amber-400" />
                AI Copilot
              </div>
            </div>
          </div>

          {/* Right: Sign-In Card */}
          <div className="flex justify-center lg:justify-end order-1 lg:order-2">
            <Card className="w-full max-w-md bg-slate-800/70 border-slate-700 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white text-2xl">Welcome</CardTitle>
                <CardDescription className="text-slate-300">
                  Sign in to access your mind maps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Primary: Microsoft SSO - Enterprise Focus */}
                <Button
                  type="button"
                  size="lg"
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 font-medium h-12"
                  onClick={handleMicrosoftLogin}
                  disabled={isMicrosoftLoading}
                >
                  {isMicrosoftLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="mr-3 h-5 w-5" viewBox="0 0 21 21" fill="none">
                        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                      </svg>
                      Sign in with Microsoft
                    </>
                  )}
                </Button>

                {/* Expandable Manual Login */}
                {!showManualLogin ? (
                  <button
                    type="button"
                    onClick={() => setShowManualLogin(true)}
                    className="w-full text-sm text-slate-400 hover:text-slate-200 transition-colors py-2"
                  >
                    Or sign in with email →
                  </button>
                ) : (
                  <>
                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-600" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-800 px-3 text-slate-400">Or use email</span>
                      </div>
                    </div>

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
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-200">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                        />
                      </div>

                      {error && (
                        <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-md">{error}</p>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 h-11"
                        disabled={isLoading}
                      >
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
                  </>
                )}

                <p className="text-sm text-slate-400 text-center pt-2">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
