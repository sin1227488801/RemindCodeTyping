#!/usr/bin/env python3
"""
Simple database viewer script for development
"""
import sqlite3
import sys
from pathlib import Path

def connect_db():
    """Connect to the database"""
    db_path = Path(__file__).parent.parent / "data" / "app.db"
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        sys.exit(1)
    return sqlite3.connect(str(db_path))

def show_tables(conn):
    """Show all tables"""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Available tables:")
    for table in tables:
        print(f"  - {table[0]}")
    return [table[0] for table in tables]

def show_table_data(conn, table_name, limit=10):
    """Show data from a specific table"""
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name} LIMIT {limit};")
    rows = cursor.fetchall()
    
    # Get column names
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = [col[1] for col in cursor.fetchall()]
    
    print(f"\n{table_name} (showing first {limit} rows):")
    print("-" * 50)
    print(" | ".join(columns))
    print("-" * 50)
    
    for row in rows:
        print(" | ".join(str(cell) for cell in row))

def main():
    """Main function"""
    conn = connect_db()
    
    if len(sys.argv) > 1:
        table_name = sys.argv[1]
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        show_table_data(conn, table_name, limit)
    else:
        tables = show_tables(conn)
        print("\nUsage:")
        print("  python scripts/db_viewer.py [table_name] [limit]")
        print("\nExamples:")
        print("  python scripts/db_viewer.py users")
        print("  python scripts/db_viewer.py questions 20")
    
    conn.close()

if __name__ == "__main__":
    main()