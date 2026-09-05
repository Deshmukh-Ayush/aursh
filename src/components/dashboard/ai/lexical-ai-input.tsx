"use client"

import React, { useRef, useState, useEffect } from "react"
import { Plus, ArrowUp, Globe } from "lucide-react"
import { motion } from "motion/react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  EditorState,
  LexicalEditor,
} from "lexical"

export interface LexicalCommandOption {
  key: string
  label: string
  description: string
  command: string
}

export interface LexicalProjectOption {
  id: string
  name: string
}

interface ScrunityAiInputProps {
  onSend?: (text: string) => void
  disabled?: boolean
  projects?: LexicalProjectOption[]
  commands?: LexicalCommandOption[]
  webSearchEnabled?: boolean
  onToggleWebSearch?: (enabled: boolean) => void
}

const DEFAULT_COMMAND_OPTIONS: LexicalCommandOption[] = [
  {
    key: "summarize",
    label: "/summarize",
    description: "Generate executive summary",
    command: "/summarize workspace project status",
  },
  {
    key: "analyze-revenue",
    label: "/analyze-revenue",
    description: "Analyze won revenue & risks",
    command: "/analyze-revenue & pipeline health",
  },
  {
    key: "review-deliverables",
    label: "/review-deliverables",
    description: "Audit pending deliverables",
    command: "/review-deliverables in review",
  },
  {
    key: "draft-contract",
    label: "/draft-contract",
    description: "Draft SOW scope & terms",
    command: "/draft-contract scope terms",
  },
]

const DEFAULT_PROJECT_OPTIONS: LexicalProjectOption[] = [
  { id: "1", name: "Acme Client Portal" },
  { id: "2", name: "Scrunity Engine" },
  { id: "3", name: "Design System V2" },
]

function EditorBridgePlugin({
  editorRef,
}: {
  editorRef: React.MutableRefObject<LexicalEditor | null>
}) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    editorRef.current = editor
  }, [editor, editorRef])
  return null
}

function KeyboardSubmitPlugin({ onSend }: { onSend: (text: string) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      if (!rootElement) return

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault()
          editor.update(() => {
            const root = $getRoot()
            const textContent = root.getTextContent().trim()
            if (textContent) {
              onSend(textContent)
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

export const LexicalAIInput  = ({
  onSend,
  disabled = false,
  projects = DEFAULT_PROJECT_OPTIONS,
  commands = DEFAULT_COMMAND_OPTIONS,
  webSearchEnabled = false,
  onToggleWebSearch,
}: ScrunityAiInputProps) => {
  const editorRef = useRef<LexicalEditor | null>(null)
  const [currentText, setCurrentText] = useState("")
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [showMentionMenu, setShowMentionMenu] = useState(false)

  const initialConfig = {
    namespace: "ScrunityAIEditor",
    onError(error: Error) {
      console.error("Lexical error:", error)
    },
    theme: {
      paragraph: "text-[15px] sm:text-sm text-foreground leading-relaxed",
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
      } else {
        setShowSlashMenu(false)
        setShowMentionMenu(false)
      }
    })
  }

  const handleSend = () => {
    if (!currentText.trim() || disabled) return
    const textToSend = currentText.trim()
    onSend?.(textToSend)

    editorRef.current?.update(() => {
      const root = $getRoot()
      root.clear()
      root.append($createParagraphNode())
    })
    setCurrentText("")
    setShowSlashMenu(false)
    setShowMentionMenu(false)
  }

  const selectCommand = (commandText: string) => {
    editorRef.current?.update(() => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode(commandText))
      root.append(paragraph)
    })
    setShowSlashMenu(false)
    editorRef.current?.focus()
  }

  const selectProject = (projectName: string) => {
    editorRef.current?.update(() => {
      const root = $getRoot()
      const current = root.getTextContent()
      const updated = current.endsWith("@")
        ? `${current.slice(0, -1)}@${projectName} `
        : `${current}@${projectName} `
      
      root.clear()
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode(updated))
      root.append(paragraph)
    })
    setShowMentionMenu(false)
    editorRef.current?.focus()
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {showSlashMenu && (
        <SlashMenu commands={commands} selectCommand={selectCommand} />
      )}

      {showMentionMenu && projects.length > 0 && (
        <MentionMenu projects={projects} selectProject={selectProject} />
      )}

      <div className="flex min-h-[100px] w-full flex-col justify-between rounded-[14px] border border-border/80 bg-background shadow-xs transition-all focus-within:border-ring/50 focus-within:ring-1 focus-within:ring-ring/20">
        <LexicalComposer initialConfig={initialConfig}>
          <div className="relative flex-1 p-3">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="max-h-[160px] min-h-[32px] w-full overflow-y-auto outline-none" />
              }
              placeholder={
                <div className="pointer-events-none absolute top-3 left-3 select-none text-[15px] text-muted-foreground sm:text-sm">
                  Ask anything or @ to add context
                </div>
              }
              ErrorBoundary={({ children }) => <div>{children}</div>}
            />
            <HistoryPlugin />
            <OnChangePlugin onChange={handleTextChange} />
            <KeyboardSubmitPlugin onSend={handleSend} />
            <EditorBridgePlugin editorRef={editorRef} />
          </div>
        </LexicalComposer>

        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowSlashMenu((prev) => !prev)
                setShowMentionMenu(false)
              }}
              title="Commands (/)"
              className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.97]"
            >
              <Plus className="h-5 w-5" />
            </button>

            {onToggleWebSearch && (
              <div
                className={cn(
                  "flex h-[30px] items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-colors select-none",
                  webSearchEnabled
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-border/60 bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => onToggleWebSearch(!webSearchEnabled)}
                  className="flex items-center gap-1.5 cursor-pointer text-xs font-medium focus:outline-none active:scale-[0.97] transition-transform duration-150"
                  aria-hidden="true"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span>Search</span>
                </button>
                <Switch
                  size="sm"
                  checked={webSearchEnabled}
                  onCheckedChange={onToggleWebSearch}
                  aria-label="Toggle web search"
                  className="data-checked:bg-brand cursor-pointer"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={disabled || !currentText.trim()}
            onClick={handleSend}
            className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[8px] bg-brand text-white transition-opacity hover:bg-brand/90 active:scale-[0.97] disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

const SlashMenu = ({
  commands,
  selectCommand,
}: {
  commands: LexicalCommandOption[]
  selectCommand: (command: string) => void
}) => {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 rounded-[12px] border border-border bg-popover text-popover-foreground p-1.5 shadow-lg">
      <div className="px-2 py-1 text-[13px] font-medium text-muted-foreground">
        Commands
      </div>

      <div className="flex flex-col gap-0.5">
        {commands.map((cmd, idx) => (
          <button
            key={cmd.key}
            type="button"
            onClick={() => selectCommand(cmd.command)}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            className="group relative flex w-full flex-col rounded-md px-2.5 py-1.5 text-left"
          >
            {hovered === idx && (
              <motion.span
                layoutId="slash-menu-hover"
                className="absolute inset-0 rounded-md bg-muted"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}

            <span className="relative z-10 text-[13px] font-medium text-foreground">
              {cmd.label}
            </span>

            <span className="relative z-10 text-[13px] text-muted-foreground">
              {cmd.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

const MentionMenu = ({
  projects,
  selectProject,
}: {
  projects: LexicalProjectOption[]
  selectProject: (projectName: string) => void
}) => {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 rounded-[12px] border border-border bg-popover text-popover-foreground p-1.5 shadow-lg">
      <div className="px-2 py-1 text-[13px] font-medium text-muted-foreground">
        Projects
      </div>

      <div className="flex flex-col gap-0.5">
        {projects.map((proj, idx) => (
          <button
            key={proj.id}
            type="button"
            onClick={() => selectProject(proj.name)}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            className="group relative flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-foreground"
          >
            {hovered === idx && (
              <motion.span
                layoutId="mention-menu-hover"
                className="absolute inset-0 rounded-md bg-muted"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}

            <span className="relative z-10">📁</span>
            <span className="relative z-10">{proj.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}