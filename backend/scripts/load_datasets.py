import pandas as pd
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'app', 'data', 'datasets')
DB_PATH = os.path.join(BASE_DIR, 'app', 'data', 'jansetu.db')

def load_datasets():
    demo_df = pd.read_csv(os.path.join(DATA_DIR, 'demographics.csv'))
    infra_df = pd.read_csv(os.path.join(DATA_DIR, 'infra_index.csv'))
    invest_df = pd.read_csv(os.path.join(DATA_DIR, 'public_investment.csv'))

    # Check for orphan rows (district codes in infra/invest not in demographics)
    valid_districts = set(demo_df['district_code'])
    
    infra_orphans = infra_df[~infra_df['district_code'].isin(valid_districts)]
    invest_orphans = invest_df[~invest_df['district_code'].isin(valid_districts)]
    
    if not infra_orphans.empty:
        print(f"Found {len(infra_orphans)} orphan rows in infra_index.csv")
    if not invest_orphans.empty:
        print(f"Found {len(invest_orphans)} orphan rows in public_investment.csv")
        
    if infra_orphans.empty and invest_orphans.empty:
        print("All district codes join correctly across all 3 tables.")

    # Load to SQLite
    conn = sqlite3.connect(DB_PATH)
    demo_df.to_sql('demographics', conn, if_exists='replace', index=False)
    infra_df.to_sql('infra_index', conn, if_exists='replace', index=False)
    invest_df.to_sql('public_investment', conn, if_exists='replace', index=False)
    
    # Store metadata for /analytics/data-sources
    metadata_df = pd.DataFrame([
        {
            "dataset": "demographics",
            "description": "District population and household data.",
            "row_count": len(demo_df),
            "is_real_data": True,
            "source": "2011 Indian Census"
        },
        {
            "dataset": "infra_index",
            "description": "Infrastructure coverage and index scores per district/category.",
            "row_count": len(infra_df),
            "is_real_data": False,
            "source": "Sample/Generated"
        },
        {
            "dataset": "public_investment",
            "description": "Public scheme budgets and spent amounts.",
            "row_count": len(invest_df),
            "is_real_data": False,
            "source": "Sample/Generated"
        }
    ])
    metadata_df.to_sql('dataset_metadata', conn, if_exists='replace', index=False)
    
    conn.close()

    print("\nRow counts loaded into database:")
    print(f"demographics: {len(demo_df)}")
    print(f"infra_index: {len(infra_df)}")
    print(f"public_investment: {len(invest_df)}")

if __name__ == '__main__':
    load_datasets()
