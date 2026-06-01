import sqlite3

def update():
    try:
        conn = sqlite3.connect("backend/placeprep.db")
        c = conn.cursor()
        
        c.execute("""
        CREATE TABLE IF NOT EXISTS opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_url VARCHAR NOT NULL,
            opportunity_type VARCHAR NOT NULL DEFAULT 'Full-Time',
            title VARCHAR NOT NULL,
            company_name VARCHAR NOT NULL,
            ai_summary TEXT,
            eligibility TEXT,
            skills JSON,
            location VARCHAR,
            deadline VARCHAR,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(created_by) REFERENCES users(id)
        );
        """)
        
        c.execute("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;")
        
        conn.commit()
        conn.close()
        print("Database updated successfully.")
    except Exception as e:
        print("Error updating DB (column might already exist):", e)

if __name__ == "__main__":
    update()
