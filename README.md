# Jobs RAG

A conversational AI assistant that answers questions about company job-related information using Retrieval-Augmented Generation (RAG). The backend is built with FastAPI and LangGraph, using ChromaDB as a vector store for semantic search over documents. It leverages LangChain with OpenAI for embeddings and language models.

The frontend is a Next.js React app with a chat interface that streams responses from the backend. It uses TailwindCSS for styling and React Query for data fetching.

## Quick Start

```bash
# Backend
cd backend
uv sync
uv run python -m uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
