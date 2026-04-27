import os
import psycopg2
from psycopg2.extras import RealDictCursor

__all__ = ["get_db_connection", "RealDictCursor"]


def get_db_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    with conn.cursor() as cur:
        cur.execute(f"SET search_path TO {os.getenv('DB_SCHEMA', 'kanban')}, public")
    return conn
