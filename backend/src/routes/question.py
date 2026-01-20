from fastapi import APIRouter
from pydantic import BaseModel

from src.agent import create_agent, run_agent


router = APIRouter()


class QuestionResponse(BaseModel):
    """Response model for the question endpoint."""
    answer: str
    sources: list[str]


@router.post("/question", response_model=QuestionResponse)
async def question(question: str) -> QuestionResponse:
    agent = create_agent()
    
    try:
        response = run_agent(question, agent=agent)
    except Exception as e:
        print(e)
        return QuestionResponse(answer=f"Error: {str(e)}", sources=[])

    return QuestionResponse(
        answer=response["answer"],
        sources=response["sources"]
    )