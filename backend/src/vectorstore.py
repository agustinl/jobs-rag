"""ChromaDB vector store setup with AI model embeddings."""

import os
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


CHROMA_PERSIST_DIR = "./chroma_db"


def get_embeddings() -> OpenAIEmbeddings:
    """Get AI model embeddings model."""
    return OpenAIEmbeddings(
        model="text-embedding-3-large",
        api_key=os.getenv("OPENAI_API_KEY"),
        dimensions=768,
    )


def get_vectorstore() -> Chroma:
    """Get or create the ChromaDB vector store."""
    return Chroma(
        collection_name="company_info",
        embedding_function=get_embeddings(),
        persist_directory=CHROMA_PERSIST_DIR,
    )


def add_documents(
    content: str,
    company_name: str,
    source_url: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> int:
    """
    Split content into chunks and add to the vector store.
    
    Args:
        content: The text content to add
        company_name: Name of the company
        source_url: URL where content was extracted from
        chunk_size: Size of each text chunk
        chunk_overlap: Overlap between chunks
        
    Returns:
        Number of documents added
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    
    chunks = text_splitter.split_text(content)
    
    documents = [
        Document(
            page_content=chunk,
            metadata={
                "company": company_name.lower(),
                "source": source_url,
            },
        )
        for chunk in chunks
    ]
    
    if documents:
        vectorstore = get_vectorstore()
        vectorstore.add_documents(documents)
    
    return len(documents)


def search_company_info(
    query: str,
    company_name: str | None = None,
    k: int = 5,
) -> list[Document]:
    """
    Search for relevant documents in the vector store.
    
    Args:
        query: The search query
        company_name: Optional filter by company name
        k: Number of results to return
        
    Returns:
        List of relevant documents
    """
    vectorstore = get_vectorstore()
    
    if company_name:
        results = vectorstore.similarity_search(
            query,
            k=k,
            filter={"company": company_name.lower()},
        )
    else:
        results = vectorstore.similarity_search(query, k=k)
    
    return results


def check_company_exists(company_name: str) -> bool:
    """Check if a company already has data in the vector store."""
    vectorstore = get_vectorstore()
    results = vectorstore.similarity_search(
        company_name,
        k=1,
        filter={"company": company_name.lower()},
    )
    return len(results) > 0
