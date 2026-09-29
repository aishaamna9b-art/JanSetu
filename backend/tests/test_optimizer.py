import pytest
from app.services.optimizer import run_simulation
from app.models.schemas import SimulatorRunRequest, ProjectRecommendation, ScoreBreakdown

def test_optimizer_knapsack():
    request = SimulatorRunRequest(
        budget=100.0,
        state="TestState",
        district="TestDistrict",
        categories=["water"]
    )
    
    candidates = [
        ProjectRecommendation(
            project_id="p1",
            cluster_id="c1",
            title="Project 1",
            category="water",
            region="R1",
            people_served=10,
            cost_estimate=40.0,
            priority_score=1.0, # obj: 10
            score_breakdown=ScoreBreakdown(volume=0, urgency=0, severity=0, infra_gap=0, population=0),
            ai_justification=""
        ),
        ProjectRecommendation(
            project_id="p2",
            cluster_id="c2",
            title="Project 2",
            category="water",
            region="R1",
            people_served=20,
            cost_estimate=50.0,
            priority_score=1.0, # obj: 20
            score_breakdown=ScoreBreakdown(volume=0, urgency=0, severity=0, infra_gap=0, population=0),
            ai_justification=""
        ),
        ProjectRecommendation(
            project_id="p3",
            cluster_id="c3",
            title="Project 3",
            category="water",
            region="R1",
            people_served=30,
            cost_estimate=60.0,
            priority_score=1.0, # obj: 30
            score_breakdown=ScoreBreakdown(volume=0, urgency=0, severity=0, infra_gap=0, population=0),
            ai_justification=""
        )
    ]
    
    # We have budget=100. 
    # Costs: p1=40, p2=50, p3=60.
    # Objectives: p1=10, p2=20, p3=30.
    # Combinations <= 100:
    # p1+p2 = 90 (obj 30)
    # p1+p3 = 100 (obj 40)
    # p2+p3 = 110 > 100 (invalid)
    # Max obj is 40 with p1 and p3.
    
    response = run_simulation(request, candidates)
    
    assert len(response.selected) == 2
    selected_ids = set(p.project_id for p in response.selected)
    assert selected_ids == {"p1", "p3"}
    assert response.total_cost == 100.0
    assert response.remaining_budget == 0.0
    assert response.people_served == 40
    assert response.gaps_closed == 2
