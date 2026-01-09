"use client";

/**
 * Share Dialog Component
 * 
 * Modal for sharing mind maps with users, teams, or via public link.
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    User,
    Users,
    Link2,
    Copy,
    Check,
    Trash2,
    Mail,
    Shield,
    Edit,
    Eye,
    ChevronsUpDown,
    Search,
} from "lucide-react";
import {
    shareWithUser,
    shareWithTeam,
    generatePublicLink,
    revokePublicLink,
    getMapShares,
    removeShare,
    type ShareInfo,
} from "@/lib/actions/share";
import { listTeams, listOrganizationUsers, type Team, type OrganizationUser } from "@/lib/actions/team";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mapId: string;
    mapTitle: string;
}

export function ShareDialog({ open, onOpenChange, mapId, mapTitle }: ShareDialogProps) {
    const router = useRouter();
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [userSearchOpen, setUserSearchOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [permission, setPermission] = useState<"view" | "edit">("view");
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<OrganizationUser[]>([]);
    const [shares, setShares] = useState<ShareInfo[]>([]);
    const [publicLink, setPublicLink] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);
    const [shareSuccessName, setShareSuccessName] = useState("");

    // Fetch existing shares, teams, and users when dialog opens
    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open, mapId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch shares
            const sharesResult = await getMapShares(mapId);
            if (sharesResult.success) {
                setShares(sharesResult.data.shares);
                setPublicLink(sharesResult.data.publicLinkUrl);
            }

            // Fetch teams
            const teamsResult = await listTeams();
            if (teamsResult.success) {
                setTeams(teamsResult.data);
            }

            // Fetch organization users
            const usersResult = await listOrganizationUsers();
            if (usersResult.success) {
                setUsers(usersResult.data);
            }
        } catch (error) {
            console.error("Failed to fetch data");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter out users who already have shares and match search query
    const availableUsers = useMemo(() => {
        return users.filter(user => {
            // Exclude users who already have access
            if (shares.some(s => s.type === "user" && s.email === user.email)) {
                return false;
            }
            // Filter by search query
            if (userSearchQuery) {
                const query = userSearchQuery.toLowerCase();
                const nameMatch = user.name?.toLowerCase().includes(query);
                const emailMatch = user.email.toLowerCase().includes(query);
                return nameMatch || emailMatch;
            }
            return true;
        });
    }, [users, shares, userSearchQuery]);

    // Filter out teams that are already shared
    const availableTeams = useMemo(() => {
        return teams.filter(team =>
            !shares.some(s => s.type === "team" && s.name === team.name)
        );
    }, [teams, shares]);

    // Get selected user display
    const selectedUser = users.find(u => u.id === selectedUserId);

    const handleShareWithUser = async () => {
        if (!selectedUserId) {
            toast.error("Please select a user");
            return;
        }

        const selectedUserData = users.find(u => u.id === selectedUserId);
        if (!selectedUserData) return;

        setIsLoading(true);
        try {
            const result = await shareWithUser(mapId, selectedUserData.email, permission);
            if (result.success) {
                // Show success animation
                setShareSuccessName(selectedUserData.name || selectedUserData.email);
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 3000);

                setSelectedUserId("");
                fetchData();
            } else {
                toast.error(result.error.message);
            }
        } catch (error) {
            toast.error("Failed to share");
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareWithTeam = async () => {
        if (!selectedTeamId) {
            toast.error("Please select a team");
            return;
        }

        setIsLoading(true);
        try {
            const result = await shareWithTeam(mapId, selectedTeamId, permission);
            if (result.success) {
                const team = teams.find(t => t.id === selectedTeamId);

                // Show success animation
                setShareSuccessName(team?.name || "team");
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 3000);

                setSelectedTeamId("");
                fetchData();
            } else {
                toast.error(result.error.message);
            }
        } catch (error) {
            toast.error("Failed to share");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        setIsLoading(true);
        try {
            const result = await generatePublicLink(mapId);
            if (result.success) {
                setPublicLink(result.data.url);
                toast.success("Public link generated");
            } else {
                toast.error(result.error.message);
            }
        } catch (error) {
            toast.error("Failed to generate link");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeLink = async () => {
        setIsLoading(true);
        try {
            const result = await revokePublicLink(mapId);
            if (result.success) {
                setPublicLink(null);
                toast.success("Public link revoked");
            } else {
                toast.error(result.error.message);
            }
        } catch (error) {
            toast.error("Failed to revoke link");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (publicLink) {
            await navigator.clipboard.writeText(publicLink);
            setIsCopied(true);
            toast.success("Link copied to clipboard");
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleRemoveShare = async (shareId: string) => {
        try {
            const result = await removeShare(shareId);
            if (result.success) {
                toast.success("Share removed");
                fetchData();
            } else {
                toast.error(result.error.message);
            }
        } catch (error) {
            toast.error("Failed to remove share");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Share "{mapTitle}"</DialogTitle>
                    <DialogDescription>
                        Share this mind map with others or generate a public link.
                    </DialogDescription>
                </DialogHeader>

                {/* Success Animation Banner */}
                {shareSuccess && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                            <Check className="h-6 w-6 text-white animate-in zoom-in duration-300" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-green-800">Shared successfully!</p>
                            <p className="text-sm text-green-600">
                                {shareSuccessName} now has access to this mind map
                            </p>
                        </div>
                    </div>
                )}

                <Tabs defaultValue="user" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="user" className="gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            User
                        </TabsTrigger>
                        <TabsTrigger value="team" className="gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            Team
                        </TabsTrigger>
                        <TabsTrigger value="link" className="gap-1.5">
                            <Link2 className="h-3.5 w-3.5" />
                            Link
                        </TabsTrigger>
                    </TabsList>

                    {/* Share with User */}
                    <TabsContent value="user" className="space-y-4 mt-4">
                        <div className="flex gap-2">
                            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={userSearchOpen}
                                        className="flex-1 justify-between font-normal"
                                    >
                                        {selectedUser ? (
                                            <span className="truncate">
                                                {selectedUser.name || selectedUser.email}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">Search users...</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search by name or email..."
                                            value={userSearchQuery}
                                            onValueChange={setUserSearchQuery}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                {userSearchQuery ? "No users found" : "Type to search users"}
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {availableUsers.slice(0, 10).map((user) => (
                                                    <CommandItem
                                                        key={user.id}
                                                        value={user.id}
                                                        onSelect={() => {
                                                            setSelectedUserId(user.id);
                                                            setUserSearchOpen(false);
                                                            setUserSearchQuery("");
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{user.name || "Unnamed"}</span>
                                                            <span className="text-xs text-slate-500">{user.email}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                                {availableUsers.length > 10 && (
                                                    <div className="py-2 px-3 text-xs text-slate-500 text-center">
                                                        +{availableUsers.length - 10} more results. Keep typing to narrow down.
                                                    </div>
                                                )}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "edit")}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">
                                        <div className="flex items-center gap-1.5">
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="edit">
                                        <div className="flex items-center gap-1.5">
                                            <Edit className="h-3.5 w-3.5" />
                                            Edit
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleShareWithUser} disabled={isLoading || !selectedUserId} className="w-full">
                            <User className="h-4 w-4 mr-2" />
                            Share with User
                        </Button>
                    </TabsContent>

                    {/* Share with Team */}
                    <TabsContent value="team" className="space-y-4 mt-4">
                        <div className="flex gap-2">
                            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select a team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTeams.length === 0 ? (
                                        <div className="py-4 text-center text-sm text-slate-500">
                                            {teams.length === 0 ? "No teams available" : "All teams already have access"}
                                        </div>
                                    ) : (
                                        availableTeams.map((team) => (
                                            <SelectItem key={team.id} value={team.id}>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {team.name}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "edit")}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">
                                        <div className="flex items-center gap-1.5">
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="edit">
                                        <div className="flex items-center gap-1.5">
                                            <Edit className="h-3.5 w-3.5" />
                                            Edit
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleShareWithTeam} disabled={isLoading || !selectedTeamId} className="w-full">
                            <Users className="h-4 w-4 mr-2" />
                            Share with Team
                        </Button>
                    </TabsContent>

                    {/* Public Link */}
                    <TabsContent value="link" className="space-y-4 mt-4">
                        {publicLink ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input value={publicLink} readOnly className="flex-1 text-sm bg-slate-50" />
                                    <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                        {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Anyone with this link can view this mind map (read-only).
                                </p>
                                <Button variant="destructive" onClick={handleRevokeLink} disabled={isLoading} className="w-full">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Revoke Link
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-slate-500 mb-4">
                                    Generate a public link that anyone can use to view this mind map.
                                </p>
                                <Button onClick={handleGenerateLink} disabled={isLoading}>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Generate Public Link
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Current Shares */}
                {shares.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <Label className="text-sm font-medium text-slate-700">Shared with</Label>
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                            {shares.map((share) => (
                                <div key={share.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {share.type === "team" ? (
                                            <Users className="h-4 w-4 text-blue-500" />
                                        ) : (
                                            <User className="h-4 w-4 text-green-500" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">{share.name}</p>
                                            {share.email && <p className="text-xs text-slate-500">{share.email}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded ${share.permission === "edit" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                                            {share.permission}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-red-600"
                                            onClick={() => handleRemoveShare(share.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
