"""Database module for Construction Intelligence Platform.

Uses Python's built-in sqlite3 to store and retrieve analysis results.
"""

import json
import os
import sqlite3
from typing import Any, Dict, List, Optional

# Resolve database file path relative to this backend directory
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "construction.db")


def get_connection() -> sqlite3.Connection:
    """Create and return a database connection with dictionary-like row access."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize the SQLite database and create the results table if not exists."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                input_summary TEXT,
                result_json TEXT NOT NULL,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def save_result(result_type: str, input_summary: str, result_json: Any) -> int:
    """Save an analysis result to the database.
    
    Args:
        result_type: Category of the result (e.g. 'safety', 'crack', 'valuation', 'planning', 'daily', 'knowledge')
        input_summary: Brief description or input parameters of the request
        result_json: Result data, either as a JSON string or dict/list to be serialized
        
    Returns:
        The inserted row ID
    """
    # Ensure result_json is stored as a formatted JSON string
    if not isinstance(result_json, str):
        serialized_json = json.dumps(result_json)
    else:
        serialized_json = result_json

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO results (type, input_summary, result_json)
            VALUES (?, ?, ?)
            """,
            (result_type, input_summary, serialized_json),
        )
        conn.commit()
        return cursor.lastrowid


def get_history(result_type: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve recent analysis results from the database.
    
    Args:
        result_type: Optional filter by result category
        limit: Maximum number of records to return (default 20)
        
    Returns:
        List of result dictionaries
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        if result_type:
            cursor.execute(
                """
                SELECT id, type, input_summary, result_json, timestamp
                FROM results
                WHERE type = ?
                ORDER BY id DESC
                LIMIT ?
                """,
                (result_type, limit),
            )
        else:
            cursor.execute(
                """
                SELECT id, type, input_summary, result_json, timestamp
                FROM results
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            )

        rows = cursor.fetchall()
        history = []
        for row in rows:
            parsed_result = None
            try:
                parsed_result = json.loads(row["result_json"])
            except Exception:
                parsed_result = row["result_json"]

            history.append(
                {
                    "id": row["id"],
                    "type": row["type"],
                    "input_summary": row["input_summary"],
                    "result": parsed_result,
                    "timestamp": row["timestamp"],
                }
            )
        return history
