import pandas as pd
import numpy as np
import os
import random

# Fixed random seed
np.random.seed(42)
random.seed(42)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_PATH = os.path.join(BASE_DIR, 'app', 'data', 'datasets', 'raw', 'india-districts-census-2011.csv')
OUTPUT_DIR = os.path.join(BASE_DIR, 'app', 'data', 'datasets')

os.makedirs(OUTPUT_DIR, exist_ok=True)

def prepare_data():
    df = pd.read_csv(RAW_DATA_PATH)
    
    # 1. Keep only Tamil Nadu and Bihar
    states_to_keep = ['TAMIL NADU', 'BIHAR']
    df = df[df['State name'].isin(states_to_keep)].copy()
    
    # 2. Create demographics.csv
    demo_df = pd.DataFrame()
    demo_df['district_code'] = df['District code']
    demo_df['state'] = df['State name'].str.title()
    demo_df['district'] = df['District name']
    demo_df['population'] = df['Population']
    demo_df['households'] = df['Households']
    demo_df['rural_pct'] = (df['Rural_Households'] / df['Households']).round(4)
    
    demo_df.to_csv(os.path.join(OUTPUT_DIR, 'demographics.csv'), index=False)
    
    # 3. Create infra_index.csv
    infra_rows = []
    other_categories = ['water', 'roads', 'health', 'education', 'sanitation', 'housing', 'agriculture', 'transport']
    
    for _, row in df.iterrows():
        dcode = row['District code']
        
        # Electricity from real data
        elec_coverage = min(1.0, row['Housholds_with_Electric_Lighting'] / max(1, row['Households']))
        elec_score = round(elec_coverage * 0.9 + 0.1 * random.uniform(0.8, 1.0), 3) # simple pseudo logic
        elec_score = min(1.0, elec_score)
        
        infra_rows.append({
            'district_code': dcode,
            'category': 'electricity',
            'coverage_pct': round(elec_coverage * 100, 2),
            'index_score': elec_score
        })
        
        # Other categories random between 0.3 and 0.95
        for cat in other_categories:
            val = random.uniform(0.3, 0.95)
            infra_rows.append({
                'district_code': dcode,
                'category': cat,
                'coverage_pct': round(val * 100, 2),
                'index_score': round(val, 3)
            })
            
    infra_df = pd.DataFrame(infra_rows)
    infra_df.to_csv(os.path.join(OUTPUT_DIR, 'infra_index.csv'), index=False)
    
    # 4. Create public_investment.csv
    invest_rows = []
    schemes = {
        'water': 'Jal Jeevan Mission',
        'roads': 'PMGSY',
        'health': 'Ayushman Bharat',
        'education': 'Samagra Shiksha',
        'housing': 'PMAY'
    }
    
    # base per capita in Rs (will be divided by 1e7 for crores)
    scheme_rates = {
        'water': 2500,
        'roads': 3500,
        'health': 1500,
        'education': 4000,
        'housing': 5000
    }
    
    for _, row in demo_df.iterrows():
        dcode = row['district_code']
        pop = row['population']
        
        for cat, scheme in schemes.items():
            base_rate = scheme_rates[cat]
            # add some random noise +- 20%
            actual_rate = base_rate * random.uniform(0.8, 1.2)
            allocated = (pop * actual_rate) / 10000000.0 # in crores
            # spending is between 40% and 95% of allocated
            spent = allocated * random.uniform(0.4, 0.95)
            
            invest_rows.append({
                'district_code': dcode,
                'scheme': scheme,
                'category': cat,
                'allocated_cr': round(allocated, 2),
                'spent_cr': round(spent, 2)
            })
            
    invest_df = pd.DataFrame(invest_rows)
    invest_df.to_csv(os.path.join(OUTPUT_DIR, 'public_investment.csv'), index=False)
    
    # 6. Add a README
    readme_content = """# Datasets Information

This directory contains processed CSV datasets for the JanSetu budget simulator.

## Data Sources
- `demographics.csv`: Real data extracted from the 2011 Indian Census for Tamil Nadu and Bihar.
- `infra_index.csv`: 
  - `electricity`: Derived from real 2011 Census data (Households with Electric Lighting).
  - `water`, `roads`, `health`, `education`, `sanitation`, `housing`, `agriculture`, `transport`: Sample generated data (randomly assigned values between 0.3 and 0.95).
- `public_investment.csv`: Sample generated data. Budget allocations and spent amounts are synthetic, generated proportionally to district population for realistic scale.

All data focuses on Tamil Nadu and Bihar districts.
"""
    with open(os.path.join(OUTPUT_DIR, 'README.md'), 'w') as f:
        f.write(readme_content)
        
    print("Row counts:")
    print(f"demographics.csv: {len(demo_df)}")
    print(f"infra_index.csv: {len(infra_df)}")
    print(f"public_investment.csv: {len(invest_df)}")
    
    print("\ndemographics.csv head:")
    print(demo_df.head().to_string())
    print("\ninfra_index.csv head:")
    print(infra_df.head().to_string())
    print("\npublic_investment.csv head:")
    print(invest_df.head().to_string())

if __name__ == '__main__':
    prepare_data()
