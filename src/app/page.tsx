import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Shield, Users, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 mb-8">
            <Shield className="h-4 w-4 text-green-400" />
            Enterprise-Grade Security
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              DigiNode
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Secure, collaborative mind-mapping built for regulated enterprise environments.
            Powered by Azure AD SSO and pessimistic locking for guaranteed data integrity.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/signin">
                Sign In
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <Link href="/auth/signup">
                Create Account
              </Link>
            </Button>
          </div>

          <p className="text-sm text-slate-500 mt-4">
            Already signed in?{" "}
            <Link href="/dashboard" className="text-blue-400 hover:underline">
              Go to Dashboard
            </Link>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Network className="h-10 w-10 text-blue-400 mb-2" />
              <CardTitle className="text-white">Mind Mapping</CardTitle>
              <CardDescription className="text-slate-400">
                Visual brainstorming with hierarchical node structures
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Shield className="h-10 w-10 text-green-400 mb-2" />
              <CardTitle className="text-white">Enterprise Security</CardTitle>
              <CardDescription className="text-slate-400">
                Azure AD SSO with multi-tenant data isolation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Users className="h-10 w-10 text-purple-400 mb-2" />
              <CardTitle className="text-white">Pessimistic Locking</CardTitle>
              <CardDescription className="text-slate-400">
                One editor at a time for conflict-free collaboration
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Zap className="h-10 w-10 text-amber-400 mb-2" />
              <CardTitle className="text-white">AI Copilot</CardTitle>
              <CardDescription className="text-slate-400">
                OpenAI-powered idea generation
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
