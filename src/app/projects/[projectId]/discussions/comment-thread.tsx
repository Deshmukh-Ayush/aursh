"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { createCommentAction, deleteCommentAction } from "@/app/actions/comment";
import { toast } from "sonner";
import { Trash2, Send } from "lucide-react";

type CommentType = {
  comment: {
    id: string;
    body: string;
    createdAt: Date;
    userId: string;
  };
  author: {
    name: string | null;
    image: string | null;
  } | null;
};

export function CommentThread({ 
  projectId, 
  deliverableId,
  comments,
  currentUserId,
  currentUserRole
}: { 
  projectId: string;
  deliverableId?: string;
  comments: CommentType[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on mount or new comment
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const result = await createCommentAction(projectId, newComment.trim(), deliverableId);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      setNewComment("");
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    // Optimistic or just wait for server
    const result = await deleteCommentAction(commentId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Comment deleted");
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background rounded-xl border shadow-sm">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
      >
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3 py-12">
            <div className="bg-muted p-4 rounded-full">
              <MessageSquareIcon className="w-8 h-8 opacity-50" />
            </div>
            <p>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map(({ comment, author }) => {
            const isMe = comment.userId === currentUserId;
            const canDelete = isMe || currentUserRole === 'owner';

            return (
              <div key={comment.id} className={`flex gap-3 sm:gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <AvatarImage src={author?.image || ""} />
                  <AvatarFallback>{author?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{author?.name || "Unknown User"}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="group relative flex items-start gap-2">
                    {isMe && canDelete && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md mt-1"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className={`px-4 py-3 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-muted rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{comment.body}</p>
                    </div>

                    {!isMe && canDelete && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md mt-1"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-muted/30 border-t">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <Textarea
            value={newComment}
            onChange={(e: any) => setNewComment(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none flex-1 rounded-xl bg-background border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary/50"
            onKeyDown={(e: any) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim()} 
            size="icon"
            className="h-[60px] w-[60px] rounded-xl flex-shrink-0 bg-primary hover:bg-primary/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
