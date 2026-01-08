/**
 * API Route for Release Lock via Beacon
 * 
 * Handles lock release from sendBeacon during page unload.
 * This ensures locks are released even when the page closes suddenly.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const mapId = body.mapId;

        if (!mapId || typeof mapId !== "string") {
            return NextResponse.json({ error: "Invalid mapId" }, { status: 400 });
        }

        // Release lock if we hold it
        await db.mindMap.updateMany({
            where: {
                id: mapId,
                lockedByUserId: session.user.id,
                organizationId: session.user.organizationId,
            },
            data: {
                isLocked: false,
                lockedByUserId: null,
                lockHeartbeat: null,
            },
        });

        return NextResponse.json({ released: true });
    } catch (error) {
        console.error("[Release Lock API] Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
