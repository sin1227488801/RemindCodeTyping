"""
Search API endpoints.

This module provides full-text search functionality for questions using the
search strategy interface with proper user scoping and query parameter validation.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from uuid import UUID

from api.dependencies import get_current_user_id, get_search_strategy
from domain.dtos import SearchResponse
from domain.exceptions import SearchIndexError, ValidationError
from infra.sqlite_search import SQLiteFtsStrategy


router = APIRouter(prefix="/search", tags=["search"])


@router.get("/questions", response_model=SearchResponse)
async def search_questions(
    q: str = Query(..., description="Search query string", min_length=1, max_length=200),
    limit: int = Query(50, description="Maximum number of results to return", ge=1, le=100),
    user_id: UUID = Depends(get_current_user_id),
    search_strategy: SQLiteFtsStrategy = Depends(get_search_strategy)
):
    """
    Search questions using full-text search for the authenticated user.
    
    This endpoint searches through questions and answers using SQLite FTS5,
    returning results with relevance scores and highlighted matches.
    Results are scoped to questions in study books owned by the authenticated user.
    
    Args:
        q: Search query string (1-200 characters)
        limit: Maximum number of results to return (1-100, default: 50)
        user_id: Current authenticated user ID
        search_strategy: Search strategy implementation
        
    Returns:
        SearchResponse with query, results, and total count
        
    Raises:
        HTTPException: 400 for validation errors, 500 for search index errors
    """
    try:
        # Validate query parameters
        if not q or not q.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Search query cannot be empty"
            )
        
        query = q.strip()
        
        if len(query) > 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Search query cannot exceed 200 characters"
            )
        
        # Perform search using strategy interface
        search_results = await search_strategy.search_questions(query, user_id, limit)
        
        # Return structured response
        return SearchResponse(
            query=query,
            results=search_results,
            total_count=len(search_results)
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except SearchIndexError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search index error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected search error: {str(e)}"
        )


@router.post("/rebuild-index", status_code=status.HTTP_204_NO_CONTENT)
async def rebuild_search_index(
    user_id: UUID = Depends(get_current_user_id),
    search_strategy: SQLiteFtsStrategy = Depends(get_search_strategy)
):
    """
    Rebuild the search index.
    
    This endpoint rebuilds the full-text search index from scratch,
    ensuring all questions are properly indexed for search.
    
    Note: This is a maintenance endpoint and may take some time to complete
    for large datasets.
    
    Args:
        user_id: Current authenticated user ID (for authorization)
        search_strategy: Search strategy implementation
        
    Raises:
        HTTPException: 500 for search index errors
    """
    try:
        await search_strategy.rebuild_index()
        
    except SearchIndexError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild search index: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error rebuilding index: {str(e)}"
        )