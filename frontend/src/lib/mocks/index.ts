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

  if (endpoint.startsWith('/analytics/summary') && (options.method === 'GET' || !options.method)) {
    const url = new URL(endpoint, 'http://localhost');
    const state = url.searchParams.get('state');
    const district = url.searchParams.get('district');
    
    // Simulate filtering by returning smaller numbers if state/district is selected
    let multiplier = 1;
    if (district) multiplier = 0.05;
    else if (state) multiplier = 0.2;

    return {
      total_requests: Math.floor(15420 * multiplier),
      resolved_rate: 0.65,
      top_categories: [
        { category: "Water", count: Math.floor(4500 * multiplier) },
        { category: "Roads", count: Math.floor(3200 * multiplier) },
        { category: "Electricity", count: Math.floor(2800 * multiplier) },
        { category: "Sanitation", count: Math.floor(2100 * multiplier) },
        { category: "Healthcare", count: Math.floor(1500 * multiplier) }
      ],
      trend: [
        { date: "2023-01-01", count: Math.floor(1200 * multiplier) },
        { date: "2023-02-01", count: Math.floor(1300 * multiplier) },
        { date: "2023-03-01", count: Math.floor(1100 * multiplier) },
        { date: "2023-04-01", count: Math.floor(1500 * multiplier) },
        { date: "2023-05-01", count: Math.floor(1800 * multiplier) },
        { date: "2023-06-01", count: Math.floor(1600 * multiplier) }
      ],
      by_status: {
        "received": Math.floor(3000 * multiplier),
        "verified": Math.floor(2500 * multiplier),
        "under_review": Math.floor(1690 * multiplier),
        "funded": Math.floor(1200 * multiplier),
        "completed": Math.floor(7030 * multiplier)
      }
    };
  }

  if (endpoint.startsWith('/analytics/gaps') && (options.method === 'GET' || !options.method)) {
    const categories = ['Water', 'Roads', 'Health', 'Education', 'Sanitation'];
    const blocks = ['Phulwari', 'Danapur', 'Patna Sadar', 'Sampatchak', 'Maner', 'Bihta', 'Naubatpur', 'Bikram', 'Paliganj', 'Masaurhi'];
    return Array.from({ length: 50 }, (_, i) => ({
      block: blocks[i % blocks.length] + (i >= 10 ? ` Ward ${Math.floor(i/10)+1}` : ''),
      district: 'Lucknow',
      category: categories[i % 5],
      demand_count: 100 + Math.floor(Math.random() * 900),
      infra_index: 0.2 + Math.random() * 0.7,
      public_spending: 500000 + Math.floor(Math.random() * 9500000),
      gap_score: 0.3 + Math.random() * 0.7,
    }));
  }

  if (endpoint === '/impact' && (options.method === 'GET' || !options.method)) {
    return [
      { district: "Lucknow", raised: 5200, resolved: 4100, resolution_rate: 0.78 },
      { district: "Kanpur", raised: 4800, resolved: 3200, resolution_rate: 0.66 },
      { district: "Varanasi", raised: 3100, resolved: 2800, resolution_rate: 0.90 },
      { district: "Agra", raised: 2900, resolved: 1400, resolution_rate: 0.48 },
      { district: "Prayagraj", raised: 3500, resolved: 1900, resolution_rate: 0.54 }
    ];
  }

  if (endpoint.startsWith('/recommendations') && (options.method === 'GET' || !options.method)) {
    const categories = ['WATER_SUPPLY', 'ROAD_INFRA', 'HEALTHCARE', 'EDUCATION', 'SANITATION'];
    return Array.from({ length: 50 }, (_, i) => ({
      project_id: `proj-${i}`,
      cluster_id: `cluster-${i}`,
      title: `${categories[i % 5].replace('_', ' ')} Upgrade Project ${i + 1}`,
      category: categories[i % 5],
      region: `Region ${Math.floor(i / 5) + 1}, Lucknow`,
      people_served: 1000 + Math.floor(Math.random() * 50000),
      cost_estimate: 1000000 + Math.floor(Math.random() * 20000000),
      priority_score: 40 + Math.floor(Math.random() * 60),
      score_breakdown: {
        volume: 10 + Math.floor(Math.random() * 20),
        urgency: 10 + Math.floor(Math.random() * 20),
        severity: 10 + Math.floor(Math.random() * 20),
        infra_gap: 10 + Math.floor(Math.random() * 20),
        population: 10 + Math.floor(Math.random() * 20),
      },
      ai_justification: `AI Analysis indicates significant need in ${categories[i%5].toLowerCase()} sector. By targeting this area, we can improve living standards for over ${1000 + Math.floor(Math.random() * 50000)} citizens. The projected cost-to-impact ratio is highly favorable compared to historical benchmarks.`
    }));
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
