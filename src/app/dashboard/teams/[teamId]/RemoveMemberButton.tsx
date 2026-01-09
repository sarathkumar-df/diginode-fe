"use client";

/**
 * Remove Member Button
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { removeTeamMember } from "@/lib/actions/team";
import { toast } from "sonner";

interface RemoveMemberButtonProps {
    teamId: string;
    memberUserId: string;
    memberName: string;
}

export function RemoveMemberButton({ teamId, memberUserId, memberName }: RemoveMemberButtonProps) {
    const router = useRouter();
    const [isRemoving, setIsRemoving] = useState(false);
    const [open, setOpen] = useState(false);

    const handleRemove = async () => {
        setIsRemoving(true);
        try {
            const result = await removeTeamMember(teamId, memberUserId);
            if (result.success) {
                toast.success("Member removed from team");
                setOpen(false);
                router.refresh();
            } else {
                toast.error(result.error.message);
            }
        } catch (error) {
            toast.error("Failed to remove member");
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove Member</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove <strong>{memberName}</strong> from this team?
                        They will lose access to all shared mind maps.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRemove}
                        disabled={isRemoving}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isRemoving ? "Removing..." : "Remove"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
