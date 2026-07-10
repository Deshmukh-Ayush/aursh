"use client";

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, FormEvent, SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { createCommentAction, deleteCommentAction } from "@/app/actions/comment";
import { toast } from "sonner";
import { Trash2, Send, CornerDownRight } from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on mount or new comment
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [newComment]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
  
    setIsSubmitting(true);
    const result = await createCommentAction(projectId, newComment.trim(), deliverableId);
  
    if (result.error) {
      toast.error(result.error);
    } else {
      setNewComment("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const result = await deleteCommentAction(commentId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Comment deleted");
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto hide-scrollbar space-y-6 pb-32"
      >
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/60 space-y-4 py-16 animate-in fade-in duration-500">
            <div className="bg-muted/30 p-5 rounded-[24px] border border-border/20">
              <MessageSquareIcon className="w-8 h-8 opacity-40" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-medium text-foreground/80">No comments yet</p>
              <p className="text-[13px] text-balance max-w-[250px]">Start the conversation by sending a message below.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {comments.map(({ comment, author }, i) => {
              const isMe = comment.userId === currentUserId;
              const canDelete = isMe || currentUserRole === 'owner';

              return (
                <div 
                  key={comment.id} 
                  className="group flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                  style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}
                >
                  <Avatar className="w-9 h-9 shrink-0 ring-1 ring-border/20 shadow-sm mt-0.5">
                    <AvatarImage src={author?.image || ""} />
                    <AvatarFallback className="bg-muted text-[11px] font-medium text-foreground/70">
                      {author?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[13px] font-semibold text-foreground/90">
                          {author?.name || "Unknown User"}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground/60 tabular-nums">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 active:scale-[0.96] rounded-md -mt-1.5 -mr-1.5"
                          title="Delete comment"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="text-[13px] leading-[1.65] text-foreground/80 break-words whitespace-pre-wrap">
                      {comment.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer (Fixed at bottom) */}
      <div className="absolute bottom-0 left-0 right-0 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent">
        <div className="relative flex flex-col bg-background border border-border/50 rounded-[14px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.04)] focus-within:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08),0_4px_12px_-4px_rgba(0,0,0,0.04)] focus-within:border-border transition-all duration-300">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-transparent border-0 px-4 py-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-0 min-h-[48px] max-h-[200px] hide-scrollbar"
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50">
              <span className="hidden sm:inline-flex items-center gap-1">
                Press <kbd className="font-sans px-1.5 py-0.5 rounded-[4px] bg-muted/50 border border-border/40 shadow-sm text-muted-foreground/80">Enter</kbd> to send
              </span>
              <span className="inline-flex sm:hidden items-center gap-1">
                Markdown supported
              </span>
            </div>
            
            <Button 
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !newComment.trim()} 
              size="sm"
              className="h-8 rounded-[8px] px-3.5 bg-foreground text-background hover:bg-foreground/90 active:scale-[0.96] transition-all duration-200 disabled:opacity-40"
            >
              <span className="text-[12px] font-semibold mr-1.5">Send</span>
              <CornerDownRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageSquareIcon(props: SVGProps<SVGSVGElement>) {
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