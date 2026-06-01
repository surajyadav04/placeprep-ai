import sqlite3
import os

DB_PATH = "placeprep.db"

def migrate_db():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Create a new table with the correct schema
        cursor.execute("""
        CREATE TABLE users_new (
            id INTEGER NOT NULL PRIMARY KEY, 
            email VARCHAR NOT NULL, 
            password_hash VARCHAR, 
            name VARCHAR, 
            role VARCHAR DEFAULT 'student', 
            is_active INTEGER DEFAULT 1, 
            auth_provider VARCHAR DEFAULT 'local', 
            google_id VARCHAR, 
            bio TEXT, 
            linkedin_url VARCHAR, 
            github_url VARCHAR, 
            portfolio_url VARCHAR, 
            profile_image_url VARCHAR, 
            skills JSON, 
            created_at DATETIME
        );
        """)

        # Copy data from old table to new table, using PRAGMA to get old columns
        cursor.execute("PRAGMA table_info(users);")
        columns = [info[1] for info in cursor.fetchall()]
        
        # Build the INSERT statement mapping old columns to new
        col_str = ", ".join(columns)
        
        # Check if the old table even has role and is_active, which were added previously
        if "role" not in columns:
            print("Warning: old table missing 'role', adding it in mapping...")
            
        cursor.execute(f"""
        INSERT INTO users_new ({col_str})
        SELECT {col_str} FROM users;
        """)

        # Drop the old table
        cursor.execute("DROP TABLE users;")

        # Rename the new table
        cursor.execute("ALTER TABLE users_new RENAME TO users;")

        # Recreate indexes
        cursor.execute("CREATE UNIQUE INDEX ix_users_email ON users (email);")
        cursor.execute("CREATE INDEX ix_users_id ON users (id);")
        cursor.execute("CREATE UNIQUE INDEX ix_users_google_id ON users (google_id);")

        conn.commit()
        print("Migration successful: Added auth_provider, google_id, and made password_hash nullable.")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
