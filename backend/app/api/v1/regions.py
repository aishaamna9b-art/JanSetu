from fastapi import APIRouter, HTTPException
import os
import csv

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEMOGRAPHICS_PATH = os.path.join(BASE_DIR, 'data', 'demographics.csv')
PINCODES_PATH = os.path.join(BASE_DIR, 'data', 'pincodes.csv')

@router.get("/regions")
def get_regions():
    if not os.path.exists(DEMOGRAPHICS_PATH):
        return {"states": []}
    
    states_dict = {}
     
    with open(DEMOGRAPHICS_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            state = row.get("State", "").strip()
            district = row.get("District", "").strip()
            if not state or not district:
                continue
            
            if state not in states_dict:
                states_dict[state] = {}
            if district not in states_dict[state]:
                states_dict[state][district] = [
                    f"{district} Block A",
                    f"{district} Block B",
                    f"{district} Block C"
                ]
                
    result = []
    for state, districts_dict in states_dict.items():
        districts_list = []
        for dist, blocks in districts_dict.items():
            districts_list.append({
                "name": dist,
                "blocks": blocks
            })
        result.append({
            "name": state,
            "districts": districts_list
        })
        
    return {"states": result}

@router.get("/pincode/{pin}")
def get_pincode(pin: str):
    if not os.path.exists(PINCODES_PATH):
        raise HTTPException(status_code=404, detail="Pincode data not found")
        
    with open(PINCODES_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("pincode") == pin:
                return {
                    "state": row.get("state", ""),
                    "district": row.get("district", ""),
                    "block": row.get("block", "")
                }
                
    raise HTTPException(status_code=404, detail="Unknown pincode")
