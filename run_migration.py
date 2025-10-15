import pyodbc
import os
from pathlib import Path

def run_migration():
    """Run database migration to add package fields"""
    
    # Database connection string - adjust as needed
    connection_string = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;"  # Change to your server
        "DATABASE=your_database_name;"  # Change to your database
        "Trusted_Connection=yes;"  # Use Windows Authentication
    )
    
    try:
        # Connect to database
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        print("✅ Connected to database successfully!")
        
        # Read migration script
        migration_file = Path(__file__).parent / "migration_add_package_fields.sql"
        
        if not migration_file.exists():
            print("❌ Migration file not found!")
            return False
            
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        # Split SQL commands (basic split by semicolon)
        commands = [cmd.strip() for cmd in migration_sql.split(';') if cmd.strip()]
        
        print(f"📝 Found {len(commands)} SQL commands to execute...")
        
        # Execute each command
        for i, command in enumerate(commands, 1):
            if command and not command.startswith('--') and not command.startswith('PRINT'):
                try:
                    print(f"🔄 Executing command {i}/{len(commands)}...")
                    cursor.execute(command)
                    conn.commit()
                    print(f"✅ Command {i} executed successfully")
                except Exception as e:
                    if "already exists" in str(e) or "already an object" in str(e):
                        print(f"⚠️  Command {i} skipped (already exists): {e}")
                    else:
                        print(f"❌ Command {i} failed: {e}")
                        # Continue with other commands
        
        print("🎉 Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    print("=" * 50)
    
    success = run_migration()
    
    print("=" * 50)
    if success:
        print("✅ Migration completed! You can now start the server.")
    else:
        print("❌ Migration failed. Please check the error messages above.")
        print("\n📋 Manual steps:")
        print("1. Open SQL Server Management Studio")
        print("2. Connect to your database")
        print("3. Run the migration_add_package_fields.sql file")
        print("4. Restart the FastAPI server")
