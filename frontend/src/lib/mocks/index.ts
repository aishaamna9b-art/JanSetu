export async function handleMockRequest(endpoint: string, options: RequestInit) {
  // Add artificial delay to simulate network
  await new Promise(resolve => setTimeout(resolve, 800));

  if (endpoint === '/auth/session' && options.method === 'POST') {
    return {
      uid: "mock-uid-123",
      role: localStorage.getItem('mock_role') || "citizen",
      language: "en",
      region: "Delhi"
    };
  }

  if (endpoint === '/requests' && options.method === 'POST') {
    return {
      id: "req-123",
      tracking_id: "TRACK-" + Math.floor(Math.random() * 10000),
      category: "water",
      sub_issue: "pipe leak",
      urgency: 4,
      sentiment: "frustrated",
      translated_text: "There is a massive water leak here.",
      original_text: "Yahan bahut paani beh raha hai.",
      confirmation_message: "We have received your request regarding water pipe leak.",
      confirmation_audio_url: "",
      photo_analysis: {
        matches_request: true,
        detected_issue: "Water leak",
        severity: 4,
        confidence: 0.95
      },
      cluster_id: "cluster-456",
      status: "received"
    };
  }

  if (endpoint === '/requests/mine' && (options.method === 'GET' || !options.method)) {
    return [
      {
        id: "req-123",
        tracking_id: "TRACK-9876",
        category: "water",
        status: "received",
        urgency: 4,
        created_at: new Date().toISOString()
      },
      {
        id: "req-124",
        tracking_id: "TRACK-5432",
        category: "roads",
        status: "verified",
        urgency: 3,
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];
  }

  if (endpoint.startsWith('/requests/') && (options.method === 'GET' || !options.method)) {
    const parts = endpoint.split('/');
    const tracking_id = parts[parts.length - 1];
    
    return {
      id: "req-123",
      tracking_id: tracking_id,
      category: "water",
      sub_issue: "pipe leak",
      urgency: 4,
      status: "under_review",
      status_timeline: [
        { status: "received", timestamp: new Date(Date.now() - 172800000).toISOString() },
        { status: "verified", timestamp: new Date(Date.now() - 86400000).toISOString() },
        { status: "under_review", timestamp: new Date().toISOString() }
      ]
    };
  }

  if (endpoint.startsWith('/dashboard/overview') && (options.method === 'GET' || !options.method)) {
    return {
      kpis: {
        total_requests: 15420,
        resolved_requests: 8230,
        avg_resolution_days: 4.5,
        total_spending: 24000000
      },
      top_categories: [
        { name: "Water", count: 4500 },
        { name: "Roads", count: 3200 },
        { name: "Electricity", count: 2800 },
        { name: "Sanitation", count: 2100 },
        { name: "Healthcare", count: 1500 }
      ],
      trend: [
        { date: "Jan", raised: 1200, resolved: 800 },
        { date: "Feb", raised: 1300, resolved: 900 },
        { date: "Mar", raised: 1100, resolved: 1000 },
        { date: "Apr", raised: 1500, resolved: 1200 },
        { date: "May", raised: 1800, resolved: 1300 },
        { date: "Jun", raised: 1600, resolved: 1500 }
      ],
      status_distribution: [
        { name: "Received", value: 3000 },
        { name: "Verified", value: 2500 },
        { name: "Under Review", value: 1690 },
        { name: "Funded", value: 1200 }
      ]
    };
  }

  if (endpoint.startsWith('/analytics/gaps') && (options.method === 'GET' || !options.method)) {
    return [
      {
        block: "Gomti Nagar",
        district: "Lucknow",
        category: "water",
        demand_count: 145,
        infra_index: 0.35,
        spending: 1200000,
        gap_score: 0.92
      },
      {
        block: "Swaroop Nagar",
        district: "Kanpur",
        category: "electricity",
        demand_count: 89,
        infra_index: 0.65,
        spending: 3400000,
        gap_score: 0.45
      },
      {
        block: "Lanka",
        district: "Varanasi",
        category: "roads",
        demand_count: 42,
        infra_index: 0.40,
        spending: 800000,
        gap_score: 0.78
      },
      {
        block: "Alambagh",
        district: "Lucknow",
        category: "sanitation",
        demand_count: 110,
        infra_index: 0.20,
        spending: 500000,
        gap_score: 0.95
      }
    ];
  }

  if (endpoint.startsWith('/recommendations') && (options.method === 'GET' || !options.method)) {
    return [
      {
        project_id: "proj-901",
        cluster_id: "cluster-891",
        title: "Gomti Nagar Main Pipeline Replacement",
        category: "water",
        region: "Gomti Nagar, Lucknow",
        people_served: 15000,
        cost_estimate: 2500000,
        priority_score: 95,
        score_breakdown: {
          volume: 20,
          urgency: 25,
          severity: 20,
          infra_gap: 15,
          population: 15
        },
        ai_justification: "High volume of severe water leak reports combined with a low historical infrastructure index for water supply in this block."
      },
      {
        project_id: "proj-902",
        cluster_id: "cluster-894",
        title: "Alambagh Sanitation Overhaul",
        category: "sanitation",
        region: "Alambagh, Lucknow",
        people_served: 22000,
        cost_estimate: 1800000,
        priority_score: 88,
        score_breakdown: {
          volume: 18,
          urgency: 20,
          severity: 15,
          infra_gap: 25,
          population: 10
        },
        ai_justification: "Critical sanitation gaps identified. Very low spending in this area despite growing population and increasing health-related citizen complaints."
      },
      {
        project_id: "proj-903",
        cluster_id: "cluster-893",
        title: "Lanka University Road Repair",
        category: "roads",
        region: "Lanka, Varanasi",
        people_served: 8500,
        cost_estimate: 3200000,
        priority_score: 72,
        score_breakdown: {
          volume: 10,
          urgency: 15,
          severity: 25,
          infra_gap: 12,
          population: 10
        },
        ai_justification: "Large potholes causing daily accidents. Though demand count is lower, the severity of the issue requires immediate attention."
      }
    ];
  }

  if (endpoint === '/simulator/run' && options.method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const budget = body.total_budget || 5000000;
    
    return {
      status: "success",
      data: {
        selected_projects: [
          {
            cluster_id: "c123",
            category: "water",
            title: "Gomti Nagar Main Pipeline Replacement",
            location: { lat: 25.594, lng: 85.137, address: "Patna, Bihar" },
            estimated_cost: 2000000,
            impact_score: 88,
            people_served: 5000,
            ai_justification: "High urgency water shortage affecting 5000 people. Low existing infrastructure."
          },
          {
            cluster_id: "c124",
            category: "roads",
            title: "Lanka University Road Repair",
            location: { lat: 25.611, lng: 85.144, address: "Patna, Bihar" },
            estimated_cost: 2500000,
            impact_score: 75,
            people_served: 7000,
            ai_justification: "Severe road damage causing daily accidents."
          }
        ],
        summary: {
          total_allocated: 4500000,
          remaining_budget: Math.max(0, budget - 4500000),
          projects_funded: 2,
          total_people_served: 12000
        },
        ai_analysis: "The allocation prioritizes immediate water needs in underserved areas, leaving sufficient budget for secondary road repairs."
      }
    };
  }

  throw new Error(`Mock endpoint not found: ${options.method} ${endpoint}`);
}
