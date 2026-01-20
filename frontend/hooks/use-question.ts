import { useMutation } from "@tanstack/react-query"
import { askQuestion } from "@/lib/api"

export function useQuestion() {
  return useMutation({
    mutationFn: askQuestion,
  })
}
