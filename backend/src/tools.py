"""LangChain tools for company data extraction and search."""

import os
from typing import Annotated
from datetime import datetime, timedelta
from langchain_core.tools import tool
from tavily import TavilyClient

from src.vectorstore import add_documents, search_company_info, check_company_exists


def get_tavily_client() -> TavilyClient:
    """Get Tavily client instance."""
    return TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def get_one_year_ago() -> datetime:
    """Get one year ago date."""
    return datetime.now() - timedelta(days=365)

@tool
def extract_company_data(
    query: Annotated[str, "The user query to extract data for"],
    company_name: Annotated[
        str,
        "The name of the company to extract data for (e.g., 'mercadolibre', 'globant')",
    ],
) -> str:
    """
    Extract company information from the internet.
    Use this tool when you need to fetch fresh data about a company that hasn't been loaded yet.
    The data will be stored in the vector database for future searches.
    """
    # Check if company data already exists
    if check_company_exists(company_name):
        return f"Company '{company_name}' data already exists in the database. Use search_company_info to query it."

    client = get_tavily_client()

    urls = [
        f"https://openqube.io/company/{company_name.lower()}/",
    ]

    results = []
    failed = []

    try:
        extract_response = client.extract(urls=urls, format="markdown")
    except Exception as e:
        return f"Error extracting data: {str(e)}"

    results.extend(extract_response.get("results", []))
    failed.extend(extract_response.get("failed_results", []))

    if not results:
        extract_failed_urls = [f.get("url", "unknown") for f in failed]
        return (
            f"Failed to extract data from any URL. Failed URLs: {extract_failed_urls}"
        )

    total_chunks = 0
    extracted_sources = []

    for result in results:
        url = result.get("url", "")
        content = result.get("raw_content", "")

        if content:
            chunks_added = add_documents(
                content=content,
                company_name=company_name,
                source_url=url,
            )
            total_chunks += chunks_added
            extracted_sources.append(url)

    if failed:
        failed_urls = [f.get("url", "unknown") for f in failed]
        return (
            f"Extracted data from {len(extracted_sources)} source(s) and added {total_chunks} chunks to the database. "
            f"Successfully extracted: {extracted_sources}. "
            f"Failed to extract: {failed_urls}. "
            f"You can now use search_company_info to query this data."
        )

    return (
        f"Successfully extracted data from {len(extracted_sources)} source(s) and added {total_chunks} chunks to the database. "
        f"Sources: {extracted_sources}. "
        f"You can now use search_company_info to query this data."
    )


@tool
def search_company_info_tool(
    query: Annotated[str, "The search query to find relevant information"],
    company_name: Annotated[
        str | None, "Optional: filter results to a specific company"
    ] = None,
) -> str:
    """
    Search the vector database for relevant company information.
    Use this tool to find specific information about companies that have already been extracted.
    If no results are found, you may need to use extract_company_data first.
    """
    results = search_company_info(query=query, company_name=company_name, k=5)

    if not results:
        if company_name:
            return (
                f"No results found for '{query}' about company '{company_name}'. "
                f"Try using extract_company_data to fetch data for this company first."
            )
        return (
            f"No results found for '{query}'. "
            f"Try using extract_company_data to fetch data for a specific company first."
        )

    # Format results for the LLM
    formatted_results = []
    for i, doc in enumerate(results, 1):
        source = doc.metadata.get("source", "unknown")
        company = doc.metadata.get("company", "unknown")
        formatted_results.append(
            f"[Result {i}] (Company: {company}, Source: {source})\n{doc.page_content}"
        )

    return "\n\n---\n\n".join(formatted_results)


@tool
def search_company_web_information(
    query: Annotated[str, "The search query to find relevant information"],
) -> str:
    """
    Search the web for relevant information about a company.
    Use this tool to find specific information about a company.
    """

    client = get_tavily_client()

    try:
        search_response = client.search(
            query=query,
            include_answer="advanced",
            search_depth="basic",
            include_images=True,
            include_favicon=True,
            country="argentina",
            # start_date=get_one_year_ago(),
            # end_date=datetime.now(),
        )
    except Exception as e:
        return f"Error searching for company web information: {str(e)}"

    if search_response:
        urls = []
        answer = search_response.get("answer", None)
        images = search_response.get("images", None)
        results = search_response.get("results", [])

        for result in results:
            urls.append(result.get("url", ""))

    return (
        f"Successfully searched the web for relevant information about the company. "
        f"Answer: {answer}. "
        f"Images: {images}. "
        f"Sources: {urls}. "
        f"You can complement the information found in the database with this information."
    )


# Export tools list for agent
TOOLS = [extract_company_data, search_company_info_tool, search_company_web_information]
