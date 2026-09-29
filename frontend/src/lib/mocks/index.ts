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

  if (endpoint.startsWith('/recommendations') && (options.method === 'GET' || !options.method)) {
    return [
      {
        cluster_id: "cluster-891",
        category: "water_supply",
        count: 145,
        lat: 26.8467,
        lng: 80.9462,
        district: "Lucknow",
        block: "Gomti Nagar",
        priority_score: 92.5,
        example_text: "Severe water shortage and broken pipes flooding the main street."
      },
      {
        cluster_id: "cluster-892",
        category: "electricity",
        count: 89,
        lat: 26.4499,
        lng: 80.3319,
        district: "Kanpur",
        block: "Swaroop Nagar",
        priority_score: 85.0,
        example_text: "Continuous power cuts for the last 48 hours. Transformers are sparkling."
      },
      {
        cluster_id: "cluster-893",
        category: "roads",
        count: 42,
        lat: 25.3176,
        lng: 82.9739,
        district: "Varanasi",
        block: "Lanka",
        priority_score: 65.5,
        example_text: "Large potholes causing daily accidents near the university gate."
      }
    ];
  }

  throw new Error(`Mock endpoint not found: ${options.method} ${endpoint}`);
}
