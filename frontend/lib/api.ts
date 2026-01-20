const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
export type QuestionResponse = {
  answer: string
  sources: string[]
}

export async function askQuestion(question: string): Promise<QuestionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/question?question=${encodeURIComponent(question)}`,
    {
      method: "POST",
    }
  )

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
