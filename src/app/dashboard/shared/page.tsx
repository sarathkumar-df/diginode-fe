/**
 * Shared with Me Page
 * 
 * Lists all mind maps shared with the current user.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2 } from "lucide-react";

export default function SharedPage() {
    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Shared with Me</h1>
                <p className="text-slate-500 mt-1">Mind maps that others have shared with you</p>
            </div>

            {/* Empty State */}
            <Card className="max-w-md mx-auto text-center py-12">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <Share2 className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Nothing shared yet</CardTitle>
                    <CardDescription>
                        When someone shares a mind map with you, it will appear here
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
