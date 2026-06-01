import sqlite3

def run_migration():
    conn = sqlite3.connect('placeprep.db')
    c = conn.cursor()
    
    try:
        c.execute('ALTER TABLE users ADD COLUMN designation VARCHAR')
    except sqlite3.OperationalError:
        pass # Already exists
        
    try:
        c.execute('ALTER TABLE users ADD COLUMN organization VARCHAR')
    except sqlite3.OperationalError:
        pass
        
    try:
        c.execute('ALTER TABLE users ADD COLUMN name_change_used BOOLEAN DEFAULT 0')
    except sqlite3.OperationalError:
        pass
        
    conn.commit()
    
    # Also create the resources table if not exists (though create_all will do this on startup)
    # Let's let create_all handle resources table.
    
    conn.close()
    print("Migration successful")

if __name__ == '__main__':
    run_migration()
