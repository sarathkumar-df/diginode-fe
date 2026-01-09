"use client";

/**
 * Add Member Dialog
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Check } from "lucide-react";
import { addTeamMember, listOrganizationUsers, type OrganizationUser, type TeamMemberInfo } from "@/lib/actions/team";
import { toast } from "sonner";

interface AddMemberDialogProps {
    teamId: string;
    existingMembers: TeamMemberInfo[];
    trigger?: React.ReactNode;
}

export function AddMemberDialog({ teamId, existingMembers, trigger }: AddMemberDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<OrganizationUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [addingUserId, setAddingUserId] = useState<string | null>(null);

    // Fetch organization users when dialog opens
    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const result = await listOrganizationUsers();
            if (result.success) {
                setUsers(result.data);
            }
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async (userId: string) => {
        setAddingUserId(userId);
        try {
            const result = await addTeamMember(teamId, userId);
            if (result.success) {
                toast.success("Member added successfully");
                router.refresh();
            } else {
                toast.error(result.error.message);
            }
        } catch (error) {
            toast.error("Failed to add member");
        } finally {
            setAddingUserId(null);
        }
    };

    // Filter out existing members
    const existingMemberIds = new Set(existingMembers.map(m => m.userId));
    const availableUsers = users.filter(u => !existingMemberIds.has(u.id));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                        Select a user from your organization to add to this team.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[300px] overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            Loading users...
                        </div>
                    ) : availableUsers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            {users.length === 0
                                ? "No users found in your organization"
                                : "All organization members are already in this team"
                            }
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                                            {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {user.name || "Unnamed User"}
                                            </p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddMember(user.id)}
                                        disabled={addingUserId === user.id}
                                        className="h-8"
                                    >
                                        {addingUserId === user.id ? (
                                            "Adding..."
                                        ) : (
                                            <>
                                                <UserPlus className="h-3 w-3 mr-1" />
                                                Add
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
