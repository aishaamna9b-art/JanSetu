import pulp
from typing import List, Dict, Any
from app.models.schemas import ProjectRecommendation, SimulatorRunResponse, SimulatorRunRequest
from google import genai
from app.config import settings

def get_gemini_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def run_simulation(
    request: SimulatorRunRequest,
    candidates: List[ProjectRecommendation]
) -> SimulatorRunResponse:
    if not candidates:
        return SimulatorRunResponse(
            selected=[],
            total_cost=0.0,
            remaining_budget=request.budget,
            people_served=0,
            gaps_closed=0,
            ai_justification="No candidate projects available to simulate."
        )

    prob = pulp.LpProblem("BudgetOptimization", pulp.LpMaximize)
    
    project_vars = {}
    for i, p in enumerate(candidates):
        var = pulp.LpVariable(f"proj_{i}", cat="Binary")
        project_vars[i] = var
        
    prob += pulp.lpSum(p.priority_score * p.people_served * project_vars[i] for i, p in enumerate(candidates))
    
    prob += pulp.lpSum(p.cost_estimate * project_vars[i] for i, p in enumerate(candidates)) <= request.budget
    
    prob.solve(pulp.PULP_CBC_CMD(msg=False))
    
    selected_indices = [i for i, var in project_vars.items() if pulp.value(var) == 1.0]
    selected_projects = [candidates[i] for i in selected_indices]
    
    total_cost = sum(p.cost_estimate for p in selected_projects)
    remaining_budget = request.budget - total_cost
    people_served = sum(p.people_served for p in selected_projects)
    gaps_closed = len(selected_projects)
    
    ai_justification = "Simulation optimized budget allocation."
    if not settings.DEV_MODE and settings.GEMINI_API_KEY:
        try:
            client = get_gemini_client()
            prompt = f"""
You are an AI assistant helping government officials allocate budgets for public projects.
The budget is {request.budget}. The simulation selected {len(selected_projects)} projects out of {len(candidates)} candidates.
Total cost is {total_cost}, serving {people_served} people.
Categories requested: {', '.join(request.categories)}.
Write a short (2-3 sentences) justification for this selection, highlighting how it maximizes impact for the given budget.
"""
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            if response and response.text:
                ai_justification = response.text.strip()
        except Exception as e:
            print("Gemini API error during justification generation:", e)

    return SimulatorRunResponse(
        selected=selected_projects,
        total_cost=total_cost,
        remaining_budget=remaining_budget,
        people_served=people_served,
        gaps_closed=gaps_closed,
        ai_justification=ai_justification
    )
