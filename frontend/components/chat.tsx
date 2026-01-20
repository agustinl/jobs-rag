/* eslint-disable @next/next/no-img-element */
"use client"

import { useCallback, useState } from "react"
import { ArrowUp, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import { Markdown } from "@/components/ui/markdown"
import { TextShimmerLoader } from "@/components/ui/loader"
import { useQuestion } from "@/hooks/use-question"
import { Components } from "react-markdown"
import { ChatContainerContent, ChatContainerRoot } from "./ui/chat-container"
import { Source, SourceTrigger } from "./ui/source"
import { PromptSuggestion } from "./ui/prompt-suggestion"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

const chatSuggestions = [
  { question: "Review de empleados en Mercado Libre", highlight: "Review de empleados" },
  { question: "Salarios en Naranja X", highlight: "Salarios" },
  { question: "Promedio de salarios en Globant", highlight: "Promedio de salarios" },
  { question: "Clima laboral en Cocos capital", highlight: "Clima laboral" },
]

const customComponents: Partial<Components> = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-4 text-[18px] leading-tight font-bold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-3 text-[17px] leading-tight font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-2 text-[16px] leading-snug font-semibold first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 mb-2 text-[15px] leading-snug font-medium first:mt-0">{children}</h4>
  ),
  p: ({ children }) => <p className="mb-3 text-[14px] leading-relaxed last:mb-0">{children}</p>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-600 underline decoration-purple-300 underline-offset-2 transition-colors hover:text-purple-800 dark:text-purple-400 dark:decoration-purple-700 dark:hover:text-purple-300"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1.5 text-[14px]">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1.5 text-[14px]">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="text-muted-foreground mb-3 border-l-4 border-purple-300 pl-4 text-[14px] italic dark:border-purple-700">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  img: ({ src, alt }) => (
      <img src={src} alt={alt} className="my-3 max-h-[200px] mx-auto rounded-lg shadow-sm" />
  ),
  hr: () => <hr className="border-border my-4" />,
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")

  const questionMutation = useQuestion()
  const isLoading = questionMutation.isPending

  const handleSubmit = useCallback(() => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    questionMutation.mutate(trimmedInput, {
      onSuccess: (response) => {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        }
        setMessages((prev) => [...prev, assistantMessage])
      },
      onError: (error) => {
        console.error("Failed to get response:", error)
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        }
        setMessages((prev) => [...prev, errorMessage])
      },
    })
  }, [input, isLoading, questionMutation])

  const handleInputChange = useCallback((value: string) => {
    setInput(value)
  }, [])

  return (
    <>
      <div className="flex flex-1 flex-col">
        {/* Messages area */}
        <div className="flex flex-col flex-1 items-center justify-center">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground flex flex-col items-center">
                <MessageAvatar
                  src={`https://robohash.org/${new Date().getDate()}`}
                  alt="Assistant"
                  fallback="AI"
                  className="h-24 w-24"
                />
                <h2 className="mb-2 text-lg font-medium">Jobs RAG Assistant</h2>
                <p className="text-sm">Ask me anything about jobs or companies</p>
              </div>
            </div>
          ) : (
            <ChatContainerRoot className="flex-1">
              <ChatContainerContent className="space-y-4">
                {messages.map((message) => (
                  <Message
                    key={message.id}
                    className={message.role === "user" ? "justify-end" : ""}
                  >
                    {message.role === "assistant" ? (
                      <MessageAvatar
                        src={`https://robohash.org/${new Date().getDate()}`}
                        alt="Assistant"
                        fallback="AI"
                      />
                    ) : null}
                    {message.role === "assistant" ? (
                      <div className="flex max-w-[80%] flex-col gap-2">
                        <Markdown
                          components={customComponents}
                          className="bg-secondary prose prose-sm dark:prose-invert rounded-lg px-3 py-2 text-sm leading-relaxed"
                        >
                          {message.content}
                        </Markdown>
                        <div className="flex flex-wrap gap-2">
                          {message.sources?.map((source) => (
                            <Source key={source} href={source}>
                              <SourceTrigger showFavicon />
                            </Source>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <MessageContent className="bg-primary text-primary-foreground max-w-[80%] text-sm leading-relaxed font-normal">
                        {message.content}
                      </MessageContent>
                    )}
                    {message.role === "user" ? (
                      <MessageAvatar src="" alt="User" fallback="U" className="bg-muted" />
                    ) : null}
                  </Message>
                ))}
                {/* Loading indicator */}
                {isLoading ? (
                  <Message>
                    <MessageAvatar
                      src={`https://robohash.org/${new Date().getDate()}`}
                      alt="Assistant"
                      fallback="AI"
                    />
                    <div className="flex items-center">
                      <TextShimmerLoader text="Thinking..." size="md" />
                    </div>
                  </Message>
                ) : null}
              </ChatContainerContent>
            </ChatContainerRoot>
          )}
        </div>
      </div>

      {/* Input area */}
      <>
        <div className="w-full space-y-2">
          <div className="w-full space-y-1 py-4">
            {messages.length === 0 && chatSuggestions.map((prompt) => (
              <PromptSuggestion
                key={prompt.question}
                highlight={prompt.highlight}
                onClick={() => setInput(prompt.question)}
              >
                {prompt.question}
              </PromptSuggestion>
            ))}
          </div>
        </div>
        <PromptInput
          value={input}
          onValueChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          className="w-full max-w-(--breakpoint-md)"
        >
          <PromptInputTextarea placeholder="Ask about jobs or companies..." />
          <PromptInputActions className="justify-end pt-2">
            <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <Square className="size-3 fill-current" />
                ) : (
                  <ArrowUp className="size-5" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </>
    </>
  )
}
