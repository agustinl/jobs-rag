import { Chat } from "@/components/chat"
import { ModeToggle } from "@/components/mode-toggle"
import { SystemMessage } from "@/components/ui/system-message"

export default function Page() {
  return (
    <div className="grid h-screen grid-rows-[auto_1fr_auto] gap-4">
      <header className="flex items-center justify-between border-b py-3">
        <h1 className="text-[36px]">💼</h1>
        <ModeToggle />
      </header>

      <main className="grid grid-rows-[1fr_auto]">
        <Chat />
      </main>

      <footer className="flex flex-col gap-2 border-t py-3">
        <SystemMessage fill>
          This AI assistant may produce inaccurate information. Always verify important details with
          official sources.
        </SystemMessage>
        <SystemMessage>Only answer from Argentina for now.</SystemMessage>
      </footer>
    </div>
  )
}
