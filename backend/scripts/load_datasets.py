import sqlite3
import os
import csv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'app', 'data', 'datasets')
DB_PATH = os.path.join(BASE_DIR, 'app', 'data', 'jansetu.db')

def load_csv(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        data = list(reader)
    return headers, data

def create_and_load_table(conn, table_name, headers, data):
    cursor = conn.cursor()
    cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
    # Assume all columns are TEXT for simplicity or infer, but sqlite is flexible
    cols = ", ".join([f"{h} TEXT" for h in headers])
    cursor.execute(f"CREATE TABLE {table_name} ({cols})")
    
    placeholders = ", ".join(["?" for _ in headers])
    cursor.executemany(f"INSERT INTO {table_name} VALUES ({placeholders})", data)
    conn.commit()

def load_datasets():
    demo_headers, demo_data = load_csv(os.path.join(DATA_DIR, 'demographics.csv'))
    infra_headers, infra_data = load_csv(os.path.join(DATA_DIR, 'infra_index.csv'))
    invest_headers, invest_data = load_csv(os.path.join(DATA_DIR, 'public_investment.csv'))

    demo_districts = set(row[demo_headers.index('district_code')] for row in demo_data)
    
    infra_orphans = [row for row in infra_data if row[infra_headers.index('district_code')] not in demo_districts]
    invest_orphans = [row for row in invest_data if row[invest_headers.index('district_code')] not in demo_districts]
    
    if infra_orphans:
        print(f"Found {len(infra_orphans)} orphan rows in infra_index.csv")
    if invest_orphans:
        print(f"Found {len(invest_orphans)} orphan rows in public_investment.csv")
        
    if not infra_orphans and not invest_orphans:
        print("All district codes join correctly across all 3 tables.")

    conn = sqlite3.connect(DB_PATH)
    
    create_and_load_table(conn, 'demographics', demo_headers, demo_data)
    create_and_load_table(conn, 'infra_index', infra_headers, infra_data)
    create_and_load_table(conn, 'public_investment', invest_headers, invest_data)
    
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS dataset_metadata")
    cursor.execute("""
    CREATE TABLE dataset_metadata (
        dataset TEXT,
        description TEXT,
        row_count INTEGER,
        is_real_data INTEGER,
        source TEXT
    )
    """)
    metadata = [
        ("demographics", "District population and household data.", len(demo_data), 1, "2011 Indian Census"),
        ("infra_index", "Infrastructure coverage and index scores per district/category.", len(infra_data), 0, "Sample/Generated"),
        ("public_investment", "Public scheme budgets and spent amounts.", len(invest_data), 0, "Sample/Generated")
    ]
    cursor.executemany("INSERT INTO dataset_metadata VALUES (?, ?, ?, ?, ?)", metadata)
    conn.commit()
    conn.close()

    print("\nRow counts loaded into database:")
    print(f"demographics: {len(demo_data)}")
    print(f"infra_index: {len(infra_data)}")
    print(f"public_investment: {len(invest_data)}")

if __name__ == '__main__':
    load_datasets()
