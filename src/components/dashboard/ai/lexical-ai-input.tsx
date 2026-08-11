"use client"

import * as React from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot, $createParagraphNode, EditorState } from "lexical"
import { ArrowUp, Folder, FileText, CheckSquare, BarChart3, Sparkles } from "lucide-react"

export interface LexicalCommandOption {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  commandText: string
}

export interface LexicalProjectOption {
  id: string
  name: string
}

interface LexicalAIInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  projects?: LexicalProjectOption[]
}

const COMMAND_OPTIONS: LexicalCommandOption[] = [
  {
    key: "summarize",
    label: "/summarize",
    description: "Generate executive summary of active projects",
    icon: <Sparkles className="h-3.5 w-3.5 text-brand" />,
    commandText: "/summarize workspace project status",
  },
  {
    key: "analyze-revenue",
    label: "/analyze-revenue",
    description: "Analyze won revenue, pipeline, and payout risks",
    icon: <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />,
    commandText: "/analyze-revenue & pipeline health",
  },
  {
    key: "review-deliverables",
    label: "/review-deliverables",
    description: "Audit pending deliverables & revision requests",
    icon: <CheckSquare className="h-3.5 w-3.5 text-sky-500" />,
    commandText: "/review-deliverables in review",
  },
  {
    key: "draft-contract",
    label: "/draft-contract",
    description: "Draft SOW scope & terms for a project",
    icon: <FileText className="h-3.5 w-3.5 text-amber-500" />,
    commandText: "/draft-contract scope terms",
  },
]

function KeyboardSubmitPlugin({ onSend }: { onSend: (text: string) => void }) {
  const [editor] = useLexicalComposerContext()

  React.useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      if (!rootElement) return

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault()
          editor.update(() => {
            const root = $getRoot()
            const text = root.getTextContent().trim()
            if (text) {
              onSend(text)
              root.clear()
              root.append($createParagraphNode())
            }
          })
        }
      }

      rootElement.addEventListener("keydown", handleKeyDown)
      return () => rootElement.removeEventListener("keydown", handleKeyDown)
    })
  }, [editor, onSend])

  return null
}

export function LexicalAIInput({ onSend, disabled, projects = [] }: LexicalAIInputProps) {
  const [currentText, setCurrentText] = React.useState("")
  const [showSlashMenu, setShowSlashMenu] = React.useState(false)
  const [showMentionMenu, setShowMentionMenu] = React.useState(false)

  const initialConfig = {
    namespace: "ScrunityAIEditor",
    onError(error: Error) {
      console.error("Lexical error:", error)
    },
    theme: {
      paragraph: "text-sm text-foreground leading-relaxed",
    },
  }

  const handleTextChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot()
      const text = root.getTextContent()
      setCurrentText(text)

      if (text.endsWith("/")) {
        setShowSlashMenu(true)
        setShowMentionMenu(false)
      } else if (text.endsWith("@")) {
        setShowMentionMenu(true)
        setShowSlashMenu(false)
      } else if (!text.includes("/") && !text.includes("@")) {
        setShowSlashMenu(false)
        setShowMentionMenu(false)
      }
    })
  }

  return (
    <div className="relative w-full rounded-2xl border border-border/50 bg-background/90 p-3.5 shadow-md backdrop-blur-sm transition-all focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative min-h-[48px] w-full px-1.5 py-0.5">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[40px] w-full resize-none text-sm text-foreground focus:outline-none" />
            }
            placeholder={
              <div className="pointer-events-none absolute top-0.5 left-1.5 text-sm text-muted-foreground/50 select-none">
                Ask Scrunity AI... Type <span className="font-mono text-foreground/80 font-medium">/</span> for commands or <span className="font-mono text-foreground/80 font-medium">@</span> for project context
              </div>
            }
            ErrorBoundary={({ children }) => <div>{children}</div>}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleTextChange} />
          <KeyboardSubmitPlugin onSend={onSend} />
        </div>
      </LexicalComposer>

      {/* Sleek Floating Slash Command Menu */}
      {showSlashMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-xl border border-border/60 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 z-50">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
            Commands
          </div>
          <div className="space-y-0.5">
            {COMMAND_OPTIONS.map((cmd) => (
              <button
                key={cmd.key}
                onClick={() => {
                  onSend(cmd.commandText)
                  setShowSlashMenu(false)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted/80 active:scale-[0.98]"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                  {cmd.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground">{cmd.label}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{cmd.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sleek Floating Mention Tag Menu */}
      {showMentionMenu && projects.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-xl border border-border/60 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 z-50">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
            Attach Project Context
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => {
                  onSend(`Analyze status & deliverables for project @${proj.name}`)
                  setShowMentionMenu(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/80 active:scale-[0.98]"
              >
                <Folder className="h-3.5 w-3.5 text-brand" />
                <span className="font-medium text-foreground truncate">{proj.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-border/20 mt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSlashMenu(!showSlashMenu)}
            className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.96]"
          >
            <span className="font-mono text-foreground font-semibold">/</span>
            <span>Commands</span>
          </button>
          <button
            type="button"
            onClick={() => setShowMentionMenu(!showMentionMenu)}
            className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.96]"
          >
            <span className="font-mono text-foreground font-semibold">@</span>
            <span>Project</span>
          </button>
        </div>

        <button
          type="button"
          disabled={disabled || !currentText.trim()}
          onClick={() => {
            if (currentText.trim()) {
              onSend(currentText.trim())
              setCurrentText("")
            }
          }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-xs transition-transform hover:bg-brand-hover active:scale-[0.94] disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
