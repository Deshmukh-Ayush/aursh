"use client"

import React, { useRef, useState, useEffect } from "react"
import { Plus, ArrowUp } from "lucide-react"
import { motion } from "motion/react"

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
      paragraph: "text-[16px] sm:text-sm text-gray-900 leading-relaxed",
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
    <div className="relative w-3xl">
      {showSlashMenu && (
        <SlashMenu commands={commands} selectCommand={selectCommand} />
      )}

      {showMentionMenu && projects.length > 0 && (
        <MentionMenu projects={projects} selectProject={selectProject} />
      )}

      <div className="flex min-h-[100px] mx-auto w-full flex-col justify-between rounded-[14px] border border-[#E8E8E8] bg-white shadow-[1px_0px_4px_0px_rgba(0,0,0,0.06),0px_1px_4px_0px_rgba(0,0,0,0.06)] transition-all focus-within:border-gray-300 focus-within:shadow-sm">
        <LexicalComposer initialConfig={initialConfig}>
          <div className="relative flex-1 p-3">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="max-h-[160px] min-h-[32px] w-full overflow-y-auto outline-none" />
              }
              placeholder={
                <div className="pointer-events-none absolute top-3 left-3 select-none text-[16px] text-gray-400 sm:text-sm">
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
          <button
            type="button"
            onClick={() => {
              setShowSlashMenu((prev) => !prev)
              setShowMentionMenu(false)
            }}
            className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-[#E8E8E8] bg-white text-neutral-500 transition-colors hover:bg-gray-100 hover:text-gray-900 active:scale-[0.97]"
          >
            <Plus className="h-5 w-5" />
          </button>

          <button
            type="button"
            disabled={disabled || !currentText.trim()}
            onClick={handleSend}
            className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[8px] bg-[#0088C4] text-white transition-opacity active:scale-[0.97] disabled:opacity-40"
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
    <div className="absolute bottom-full left-0 mb-2 w-72 rounded-[12px] border border-[#E8E8E8] bg-white p-1.5 shadow-lg">
      <div className="px-2 py-1 text-[11px] font-medium text-neutral-400">
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
                className="absolute inset-0 rounded-md bg-neutral-200"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}

            <span className="relative z-10 text-xs font-medium text-neutral-900">
              {cmd.label}
            </span>

            <span className="relative z-10 text-[11px] text-neutral-500">
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
    <div className="absolute bottom-full left-0 mb-2 w-64 rounded-[12px] border border-[#E8E8E8] bg-white p-1.5 shadow-lg">
      <div className="px-2 py-1 text-[11px] font-medium text-neutral-400">
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
            className="group relative flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-neutral-900"
          >
            {hovered === idx && (
              <motion.span
                layoutId="mention-menu-hover"
                className="absolute inset-0 rounded-md bg-neutral-200"
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