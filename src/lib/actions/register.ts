"use server";

/**
 * Registration Action
 * 
 * Creates new users with email/password authentication.
 */

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import {
    ActionResult,
    successResult,
    handleActionError,
    ValidationError,
} from "@/lib/errors";

const RegisterInputSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export interface RegisterResult {
    userId: string;
    email: string;
}

export async function registerUser(
    input: RegisterInput
): Promise<ActionResult<RegisterResult>> {
    try {
        const validated = RegisterInputSchema.parse(input);

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email: validated.email },
        });

        if (existingUser) {
            throw new ValidationError("An account with this email already exists");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validated.password, 12);

        // Create a default organization for new users
        // In production, you might want to assign to existing orgs or have a different flow
        const organization = await db.organization.create({
            data: {
                name: `${validated.name}'s Organization`,
                tenantId: `local-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            },
        });

        // Create user
        const user = await db.user.create({
            data: {
                email: validated.email,
                name: validated.name,
                password: hashedPassword,
                organizationId: organization.id,
            },
        });

        return successResult({
            userId: user.id,
            email: user.email,
        });

    } catch (error) {
        return handleActionError(error);
    }
}
