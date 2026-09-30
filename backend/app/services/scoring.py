import csv
from pathlib import Path
from app.config import settings
import math

DATA_DIR = Path(__file__).parent.parent / "data" / "datasets"

def get_demographics(district: str, block: str):
    file_path = DATA_DIR / "demographics.csv"
    if not file_path.exists():
        return {"population": 100000, "vulnerable_pop": 10000}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("district") == district and row.get("block") == block:
                return {
                    "population": int(row["population"]),
                    "vulnerable_pop": int(row["vulnerable_pop"])
                }
    return {"population": 100000, "vulnerable_pop": 10000}

def get_infra_index(district: str, block: str, category: str):
    file_path = DATA_DIR / "infra_index.csv"
    if not file_path.exists():
        return 0.5
        
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("district") == district and row.get("block") == block and row.get("category") == category:
                return float(row["infra_index"])
    return 0.5

def calculate_priority_score(
    count: int, 
    urgency_avg: float, 
    photo_severity_avg: float, 
    district: str, 
    block: str, 
    category: str
) -> dict:
    # 1. volume_norm: log scale to prevent huge counts from dominating completely
    volume_norm = math.log10(count + 1)
    
    # 2. urgency (1-5) normalized to 1-2 multiplier
    urgency_multiplier = 1.0 + (urgency_avg / 5.0)
    
    # 3. photo_severity (1-5) normalized
    photo_severity_multiplier = 1.0 + (photo_severity_avg / 5.0)
    
    # 4. infra_index (0-1, where 1 means perfect infra)
    infra = get_infra_index(district, block, category)
    infra_factor = (1.0 - infra)
    if infra_factor <= 0.1:
        infra_factor = 0.1 # Minimum factor
        
    # 5. population_weight
    demo = get_demographics(district, block)
    pop = demo["population"]
    vul = demo["vulnerable_pop"]
    
    # Base weight 1.0 + up to 0.5 for population size + up to 0.5 for vulnerable ratio
    pop_weight = 1.0 + min((pop / 500000.0) * 0.5, 0.5) + min((vul / max(pop, 1)) * 2 * 0.5, 0.5)
    
    priority = volume_norm * urgency_multiplier * photo_severity_multiplier * infra_factor * pop_weight
    
    # Normalize final score between 0 and 1 using a squashing function
    final_score = 1.0 - (1.0 / (1.0 + priority))
    
    # Store every factor in score_breakdown so the UI can show "why this project".
    breakdown = {
        "volume_norm": round(volume_norm, 3),
        "urgency_multiplier": round(urgency_multiplier, 3),
        "photo_severity_multiplier": round(photo_severity_multiplier, 3),
        "infra_deficit": round(infra_factor, 3),
        "population_weight": round(pop_weight, 3)
    }
    
    return {
        "score": round(final_score, 3),
        "breakdown": breakdown
    }
