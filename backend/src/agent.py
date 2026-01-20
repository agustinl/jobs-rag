"""Agentic RAG implementation using LangGraph and AI models."""

import os
from typing import Annotated, TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from src.tools import TOOLS


# Response model
class AgentResponse(TypedDict):
    """Response from the agent."""
    answer: str
    sources: list[str]


# Agent state
class AgentState(TypedDict):
    """State for the agent."""
    messages: Annotated[list[BaseMessage], add_messages]


SYSTEM_PROMPT = """You are a helpful assistant specialized in providing information about companies.

You have access to two tools:
1. **extract_company_data**: Use this to fetch and store company information from the internet. Use this when a user asks about a company for the first time.
2. **search_company_info_tool**: Use this to search the database for relevant information about companies. Use this after data has been extracted or to find specific details.
3. **search_company_web_information**: Use this to search the web for relevant information about a company. Use this to complement the information found in the database.

When answering questions about a company:
1. First, try to search for existing data using search_company_info_tool
2. If no data is found, use extract_company_data to fetch the company's information
3. Then search again to find the specific information needed
4. Always use search_company_web_information to search the web for relevant information about the company
5. Provide a comprehensive answer based on the retrieved information

Prevent quoting sources in the response. Add one image if available to the response. If you cannot find information about a company, let the user know and suggest they verify the company name. Add the date of the information to the response.

Be concise but thorough in your responses. Focus on answering the user's specific question. Answer on question language."""


def get_llm() -> ChatOpenAI:
    """Get AI model LLM instance."""
    return ChatOpenAI(
        model="gpt-4o-mini",
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.1,
    )


def create_agent():
    """Create the agentic RAG graph."""
    llm = get_llm()
    llm_with_tools = llm.bind_tools(TOOLS)
    
    # Define the agent node
    def agent_node(state: AgentState) -> dict:
        """Process messages and decide on actions."""
        messages = state["messages"]
        
        # Add system prompt if not present
        if not any(isinstance(m, SystemMessage) for m in messages):
            messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(messages)
        
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}
    
    # Define routing logic
    def should_continue(state: AgentState) -> str:
        """Determine if we should continue to tools or end."""
        messages = state["messages"]
        last_message = messages[-1]
        
        # If the LLM made a tool call, route to tools
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        
        # Otherwise, end the conversation
        return END
    
    # Create the graph
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("agent", agent_node)
    graph.add_node("tools", ToolNode(TOOLS))
    
    # Add edges
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, ["tools", END])
    graph.add_edge("tools", "agent")
    
    app = graph.compile()
    
    app.get_graph().draw_mermaid_png(output_file_path="graph.png")

    return app


def extract_sources_from_messages(messages: list[BaseMessage]) -> list[str]:
    """
    Extract source URLs from tool messages.
    
    Args:
        messages: List of messages from the agent conversation
        
    Returns:
        List of unique source URLs
    """
    sources = set()
    
    for message in messages:
        if isinstance(message, ToolMessage):
            content = message.content
            # Extract URLs from Sources: [...] pattern
            if "Sources:" in content:
                import re
                # Match URLs in the Sources section
                urls_match = re.findall(r'https?://[^\s,\]\)]+', content)
                for url in urls_match:
                    # Clean up trailing punctuation
                    url = url.rstrip('.,;\'\"')
                    sources.add(url)
    
    return list(sources)


def run_agent(query: str, agent=None) -> AgentResponse:
    """
    Run the agent with a query.
    
    Args:
        query: The user's question about a company
        agent: Optional pre-compiled agent (for reuse)
        
    Returns:
        AgentResponse with answer and sources
    """
    if agent is None:
        agent = create_agent()
    
    initial_state = {
        "messages": [HumanMessage(content=query)]
    }
    
    # Run the agent
    result = agent.invoke(initial_state)
    
    # Get the final response
    final_message = result["messages"][-1]
    
    # Extract sources from tool messages
    sources = extract_sources_from_messages(result["messages"])

    return AgentResponse(
        answer=final_message.content,
        sources=sources
    )
