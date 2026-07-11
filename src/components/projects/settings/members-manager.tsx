"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Link2, Trash2, Mail, UserPlus2, Copy, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Member = {
  id: string; // project_member id
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

type Invite = {
  id: string;
  email: string;
  token: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
};

export function MembersManager({
  projectId,
  members,
  invites,
  role,
  currentUserId
}: {
  projectId: string;
  members: Member[];
  invites: Invite[];
  role: string;
  currentUserId: string;
}) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [newInviteToken, setNewInviteToken] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const router = useRouter();
  
  const canEdit = role === "owner" || role === "agency";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !canEdit) return;

    setIsInviting(true);
    setNewInviteToken(null);
    try {
      const res = await axios.post('/api/projects/invites', { projectId, email });
      if (res.data.success && res.data.token) {
        toast.success("Invite link generated!");
        setNewInviteToken(res.data.token);
        setEmail("");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const copyToClipboard = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Invite link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      const res = await axios.delete(`/api/projects/invites?inviteId=${inviteId}`);
      if (res.data.success) {
        toast.success("Invite revoked");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to revoke invite");
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    try {
      const res = await axios.delete(`/api/projects/members?projectId=${projectId}&targetUserId=${targetUserId}`);
      if (res.data.success) {
        toast.success("Member removed");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove member");
    }
  };

  const getRoleBadgeColor = (roleStr: string) => {
    switch(roleStr) {
      case 'owner': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'agency': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'client': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default: return 'bg-muted text-muted-foreground border-border/40';
    }
  };

  return (
    <div className="grid gap-6">
      
      {/* Invite Section */}
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus2 className="w-4 h-4 text-muted-foreground" />
            Invite Client
          </CardTitle>
          <CardDescription>
            Generate a secure, one-time link to invite a client to this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleInvite} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start gap-4 max-w-lg">
              <div className="space-y-2 w-full relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground/60" />
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!canEdit || isInviting}
                  placeholder="client@example.com"
                  className="h-9 pl-9 text-[13px] rounded-lg shadow-sm w-full"
                  required
                />
              </div>
              {canEdit && (
                <Button 
                  type="submit"
                  disabled={isInviting || !email.trim()}
                  className="h-9 px-4 rounded-lg shrink-0 w-full sm:w-auto"
                >
                  {isInviting ? "Generating..." : "Generate Link"}
                </Button>
              )}
            </div>
            
            {newInviteToken && (
              <div className="mt-2 p-3.5 bg-green-500/10 border border-green-500/20 rounded-[10px] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-semibold text-green-700 dark:text-green-400">Ready to share</span>
                  <span className="text-[11px] text-green-600/80 dark:text-green-500/80 truncate font-mono">
                    {window.location.origin}/invite/{newInviteToken.substring(0, 8)}...
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newInviteToken)}
                  className="h-8 shrink-0 bg-background/50 hover:bg-background border-green-500/20 text-green-700 dark:text-green-400"
                >
                  {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  {copiedLink ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Pending Invitations</CardTitle>
          </CardHeader>
          <div className="divide-y divide-border/40">
            {invites.map(invite => (
              <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 bg-background">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-foreground">{invite.email}</span>
                    <span className="text-[11px] text-muted-foreground">
                      Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(invite.token)}
                    className="h-7 px-2.5 text-[11px] font-medium"
                  >
                    <Link2 className="w-3 h-3 mr-1.5" />
                    Copy
                  </Button>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(invite.id)}
                      className="h-7 px-2.5 text-[11px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Members */}
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
          <CardTitle className="text-base font-semibold">Active Members</CardTitle>
          <CardDescription>
            People with access to this project workspace.
          </CardDescription>
        </CardHeader>
        <div className="divide-y divide-border/40">
          {members.map(m => {
            const isMe = m.userId === currentUserId;
            
            return (
              <div key={m.id} className="flex items-center justify-between p-4 sm:p-5 bg-background group">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border shadow-sm">
                    <AvatarImage src={m.user?.image || ""} />
                    <AvatarFallback className="bg-muted text-[11px] font-medium">
                      {m.user?.name?.charAt(0).toUpperCase() || m.user?.email.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">
                        {m.user?.name || "Unknown User"} {isMe && <span className="text-muted-foreground font-normal">(You)</span>}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-[4px] border ${getRoleBadgeColor(m.role)}`}>
                        {m.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {m.user?.email}
                    </span>
                  </div>
                </div>
                
                {canEdit && !isMe && m.role !== 'owner' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveMember(m.userId)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Remove access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
