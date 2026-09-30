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
