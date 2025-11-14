import pyodbc

conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=master;"
    "Trusted_Connection=yes;"
)

try:
    conn = pyodbc.connect(conn_str)
    print("✅ Kết nối SQL Server thành công!")
    conn.close()
except Exception as e:
    print("❌ Lỗi kết nối:", e)