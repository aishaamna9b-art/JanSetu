# JanSetu API Contract

**Single Source of Truth for Backend/Frontend integration.**

## Overview
- **Base URL**: `http://localhost:8000/api/v1`
- **Frontend Env Var**: `VITE_API_BASE_URL`
- **Format**: All requests and responses are JSON (except file uploads which use `multipart/form-data`).
- **Errors**: Return format `{"error": {"code": "string", "message": "string"}}`

## Authentication
Frontend logs in via Firebase Auth and sends the ID token.
Header: `Authorization: Bearer <token>`
Backend verifies the token and extracts the `role` custom claim.

### Roles
- `citizen`: phone OTP login
- `officer`: Google/email login
- `admin`: email login

## Enums
### Categories
- `water`, `roads`, `electricity`, `health`, `education`, `sanitation`, `housing`, `agriculture`, `transport`, `other`

### Statuses
- `received`, `verified`, `under_review`, `funded`, `completed`, `rejected`

### Languages
- `en`, `hi`, `ta`, `te`, `kn`, `ml`, `bn`, `mr`, `gu` (Starting with `en`, `hi`, `ta`)

---

## Endpoints

### Auth

#### `POST /auth/session`
Verifies token and initializes user session.
- **Role**: Any valid logged in user
- **Request**: `{}` (auth token in header)
- **Response**:
```json
{
  "uid": "12345",
  "role": "citizen",
  "language": "hi",
  "region": "Delhi"
}
```

### Citizen Requests

#### `POST /requests`
Submit a new citizen request (audio, text, or photo).
- **Role**: `citizen`
- **Format**: `multipart/form-data`
- **Fields**:
  - `text` (string, optional)
  - `audio` (file, optional)
  - `photo` (file, optional)
  - `language` (string, required)
  - `lat` (float, optional)
  - `lng` (float, optional)
  - `state` (string, optional)
  - `district` (string, optional)
  - `block` (string, optional)
- **Response**:
```json
{
  "id": "req-101",
  "tracking_id": "TRK-987654",
  "category": "water",
  "sub_issue": "pipe_leak",
  "urgency": 4, 
  "sentiment": "frustrated",
  "translated_text": "There is a massive water leak in the main pipeline for 3 days.",
  "original_text": "3 din se main pipeline mein paani leak ho raha hai.",
  "confirmation_message": "Aapki shikayat darj kar li gayi hai. Tracking ID: TRK-987654",
  "confirmation_audio_url": "https://storage.googleapis.com/.../audio.mp3",
  "photo_analysis": {
    "matches_request": true,
    "detected_issue": "water_pooling_large_leak",
    "severity": 4,
    "confidence": 0.92
  },
  "cluster_id": "cluster-55",
  "status": "received"
}
```

#### `GET /requests/mine`
Get all requests submitted by the logged-in citizen.
- **Role**: `citizen`
- **Response**: List of request objects (as returned by POST `/requests`).

#### `GET /requests/{tracking_id}`
Get details of a specific request, including its timeline.
- **Response**:
```json
{
  "request_details": {
    "id": "req-101",
    "tracking_id": "TRK-987654",
    "category": "water",
    "status": "verified"
  },
  "timeline": [
    {
      "status": "received",
      "timestamp": "2024-03-01T10:00:00Z"
    },
    {
      "status": "verified",
      "timestamp": "2024-03-02T14:30:00Z"
    }
  ]
}
```

### Officer Analytics & Hotspots

#### `GET /analytics/summary`
Get summary statistics for a region.
- **Role**: `officer`
- **Query Params**: `state`, `district`, `category`, `from`, `to`
- **Response**:
```json
{
  "total_requests": 1500,
  "resolved_rate": 0.45,
  "top_categories": [
    {"category": "water", "count": 500},
    {"category": "roads", "count": 420}
  ],
  "by_status": {
    "received": 200,
    "verified": 300,
    "under_review": 150,
    "funded": 100,
    "completed": 675,
    "rejected": 75
  },
  "trend": [
    {"date": "2024-03-01", "count": 50},
    {"date": "2024-03-02", "count": 65}
  ]
}
```

#### `GET /analytics/hotspots`
Get demand hotspots (clusters of issues).
- **Role**: `officer`
- **Query Params**: `state`, `district`, `category`
- **Response**:
```json
[
  {
    "cluster_id": "cluster-55",
    "category": "water",
    "count": 45,
    "lat": 28.7041,
    "lng": 77.1025,
    "district": "North West Delhi",
    "block": "Rohini",
    "priority_score": 0.88,
    "example_text": "No water supply for 3 days in Sector 15."
  }
]
```

#### `GET /analytics/gaps`
Get infrastructure gaps matching demand vs actual spending.
- **Role**: `officer`
- **Query Params**: `state`, `district`
- **Response**:
```json
[
  {
    "block": "Rohini",
    "district": "North West Delhi",
    "category": "water",
    "demand_count": 120,
    "infra_index": 0.4,
    "spending": 500000,
    "gap_score": 0.92
  }
]
```

#### `GET /recommendations`
Get AI-recommended projects based on hotspots and gaps.
- **Role**: `officer`
- **Query Params**: `state`, `district`, `limit`
- **Response**:
```json
[
  {
    "project_id": "proj-901",
    "cluster_id": "cluster-55",
    "title": "Rohini Sector 15 Main Pipeline Replacement",
    "category": "water",
    "region": "Rohini, North West Delhi",
    "people_served": 15000,
    "cost_estimate": 2500000,
    "priority_score": 95,
    "score_breakdown": {
      "volume": 20,
      "urgency": 25,
      "severity": 20,
      "infra_gap": 15,
      "population": 15
    },
    "ai_justification": "High volume of severe water leak reports combined with a low historical infrastructure index for water supply in this block."
  }
]
```

#### `POST /simulator/run`
Run a budget simulation to see optimal project selection.
- **Role**: `officer`
- **Body**:
```json
{
  "budget": 5000000,
  "state": "Delhi",
  "district": "North West Delhi",
  "categories": ["water", "roads"]
}
```
- **Response**:
```json
{
  "selected": [
    { /* project_id: proj-901, ... */ },
    { /* project_id: proj-902, ... */ }
  ],
  "total_cost": 4800000,
  "remaining_budget": 200000,
  "people_served": 32000,
  "gaps_closed": 3,
  "ai_justification": "Prioritized water and road projects in Rohini and Pitampura to maximize people served within the 50L budget constraint."
}
```

#### `POST /briefs/generate`
Generate a PDF brief/report for policymakers.
- **Role**: `officer`
- **Body**: `{ "state": "Delhi", "district": "North West Delhi" }`
- **Response**:
```json
{
  "brief_url": "https://storage.googleapis.com/.../brief_delhi_nw.pdf",
  "summary": "Executive Summary: Top priority remains water infrastructure in Rohini block, with 120 severe complaints in the past week. Recommend allocating 2.5M INR for pipeline overhaul."
}
```

#### `PATCH /requests/{id}/status`
Update the status of a request.
- **Role**: `officer`
- **Body**: `{ "status": "funded", "note": "Approved in Q1 budget" }`

#### `PATCH /clusters/{id}`
Human-in-the-loop correction for a cluster.
- **Role**: `officer`
- **Body**: `{ "category": "sanitation" }`

#### `GET /impact`
Get general impact metrics.
- **Query Params**: `state`, `district`
- **Response**:
```json
[
  {
    "district": "North West Delhi",
    "raised": 1000,
    "resolved": 600,
    "resolution_rate": 0.6
  }
]
```

### Admin Endpoints

#### `POST /admin/datasets`
Upload CSV configurations.
- **Role**: `admin`
- **Format**: `multipart/form-data`
- **File Types**: `demographics`, `infra_index`, `public_spending`

#### `POST /admin/regions`
Add state/district configuration.
- **Role**: `admin`

#### `GET /admin/users`
Get list of users.
- **Role**: `admin`

#### `PATCH /admin/users`
Update user roles/settings.
- **Role**: `admin`
