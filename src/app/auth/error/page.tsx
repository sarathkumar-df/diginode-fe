import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    const errorMessages: Record<string, string> = {
        Configuration: "There is a problem with the server configuration.",
        AccessDenied: "You do not have permission to sign in.",
        Verification: "The verification link was invalid or has expired.",
        Default: "An error occurred during authentication.",
    };

    const message = errorMessages[error || "Default"] || errorMessages.Default;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
                <CardHeader className="text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                    <CardTitle className="text-white">Authentication Error</CardTitle>
                    <CardDescription className="text-slate-400">
                        {message}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button asChild variant="default">
                        <Link href="/auth/signin">Try Again</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/">Go Home</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
