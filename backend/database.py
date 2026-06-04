import sqlite3
import pandas as pd
import os

DB_PATH = "ipl_dynasty.db"

def get_db_connection():
    """
    Returns a database connection.
    To migrate to PostgreSQL:
    import psycopg2
    return psycopg2.connect("postgresql://user:password@localhost:5432/ipl_dynasty")
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(df_matches: pd.DataFrame = None, overwrite: bool = False):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if overwrite:
        cursor.execute("DROP TABLE IF EXISTS matches")
        print("Dropped existing matches table for overwrite.")
    
    # Create matches table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS matches (
        match_id INTEGER PRIMARY KEY,
        date TEXT,
        year INTEGER,
        season TEXT,
        stage TEXT,
        team1 TEXT,
        team2 TEXT,
        toss_winner TEXT,
        toss_decision TEXT,
        venue TEXT,
        city TEXT,
        winner TEXT,
        win_outcome TEXT,
        result_type TEXT,
        team1_runs INTEGER,
        team2_runs INTEGER,
        team1_wickets INTEGER,
        team2_wickets INTEGER,
        team1_balls INTEGER,
        team2_balls INTEGER
    )
    """)
    
    # If df_matches is provided, insert it
    if df_matches is not None and not df_matches.empty:
        # Check if table already has data to avoid duplicate insertion
        cursor.execute("SELECT COUNT(*) FROM matches")
        count = cursor.fetchone()[0]
        if count == 0 or overwrite:
            if overwrite:
                cursor.execute("DELETE FROM matches")
            df_matches.to_sql("matches", conn, if_exists="append", index=False)
            print(f"Stored {len(df_matches)} matches in database.")
            
    conn.commit()
    conn.close()

def load_matches_from_db() -> pd.DataFrame:
    conn = get_db_connection()
    try:
        df = pd.read_sql_query("SELECT * FROM matches", conn)
        return df
    except Exception as e:
        return pd.DataFrame()
    finally:
        conn.close()
