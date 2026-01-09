"use client";

/**
 * Create Team Dialog
 */

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createTeam } from "@/lib/actions/team";
import { toast } from "sonner";

interface CreateTeamDialogProps {
    trigger?: React.ReactNode;
}

export function CreateTeamDialog({ trigger }: CreateTeamDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Team name is required");
            return;
        }

        setIsCreating(true);
        try {
            const result = await createTeam(name, description || undefined);
            if (result.success) {
                toast.success("Team created successfully");
                setOpen(false);
                setName("");
                setDescription("");
                router.refresh();
            } else {
                toast.error(result.error.message);
            }
        } catch (error) {
            toast.error("Failed to create team");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Team</DialogTitle>
                    <DialogDescription>
                        Create a new team to collaborate with others on mind maps.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Team Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Marketing Team"
                            disabled={isCreating}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this team for?"
                            rows={3}
                            disabled={isCreating}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
                        {isCreating ? "Creating..." : "Create Team"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
