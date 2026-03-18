# ResumeAI API

**Parse, score, and rank CVs in Spanish and English — powered by Claude AI.**

The only CV API with **native Latin American Spanish support** (Peru, Mexico, Chile, Colombia, Argentina). Handles the formats, sections, and conventions that English-only APIs miss.

---

## What it does

| Endpoint | Description |
|----------|-------------|
| `POST /v1/parse` | Extract structured JSON from a CV (PDF, DOCX, or text) |
| `POST /v1/score` | Score a candidate against a Job Description (0–100) |
| `POST /v1/rank` | Rank up to 20 CVs against a JD, ordered by fit |
| `GET /health` | Health check |

---

## Why ResumeAI vs the competition

| Feature | ResumeAI | Affinda | Sovren | ResumeParser.io |
|---------|----------|---------|--------|-----------------|
| Spanish LATAM native support | ✅ | ❌ | ❌ | Partial |
| Scoring vs Job Description | ✅ | ❌ | ✅ | ❌ |
| Batch ranking | ✅ | ❌ | ❌ | ❌ |
| Gap analysis | ✅ | ❌ | Partial | ❌ |
| Hire/no-hire recommendation | ✅ | ❌ | ❌ | ❌ |

---

## Authentication

All requests must include your RapidAPI key in the standard header:

```
X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
X-RapidAPI-Host: resumeai-api.p.rapidapi.com
```

---

## Plans & Limits

| Plan | Requests/min | Price |
|------|-------------|-------|
| Free | 5 | $0/mo |
| Basic | 20 | $9/mo |
| Pro | 100 | $29/mo |
| Ultra | 500 | $99/mo |

---

## Code Examples

### POST /v1/parse

**curl**
```bash
curl -X POST 'https://resumeai-api.p.rapidapi.com/v1/parse' \
  -H 'X-RapidAPI-Key: YOUR_KEY' \
  -H 'X-RapidAPI-Host: resumeai-api.p.rapidapi.com' \
  -H 'Content-Type: application/json' \
  -d '{
    "file": "Carlos Mendoza\nDesarrollador Senior\nLima, Peru...",
    "file_type": "text",
    "language": "es"
  }'
```

**Python**
```python
import requests
import base64

# For PDF files
with open("cv.pdf", "rb") as f:
    file_b64 = base64.b64encode(f.read()).decode()

response = requests.post(
    "https://resumeai-api.p.rapidapi.com/v1/parse",
    headers={
        "X-RapidAPI-Key": "YOUR_KEY",
        "X-RapidAPI-Host": "resumeai-api.p.rapidapi.com",
        "Content-Type": "application/json",
    },
    json={
        "file": file_b64,
        "file_type": "pdf",
        "language": "auto",
    },
)
data = response.json()
print(data["data"]["personal"]["nombre_completo"])
print(data["data"]["nivel_seniority"])
```

**JavaScript / Node.js**
```javascript
import fs from 'fs';

const fileB64 = fs.readFileSync('cv.pdf').toString('base64');

const response = await fetch('https://resumeai-api.p.rapidapi.com/v1/parse', {
  method: 'POST',
  headers: {
    'X-RapidAPI-Key': 'YOUR_KEY',
    'X-RapidAPI-Host': 'resumeai-api.p.rapidapi.com',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    file: fileB64,
    file_type: 'pdf',
    language: 'auto',
  }),
});

const { data } = await response.json();
console.log(data.personal.nombre_completo);
console.log(data.skills.tecnicos);
```

**PHP**
```php
<?php
$fileB64 = base64_encode(file_get_contents('cv.pdf'));

$response = file_get_contents('https://resumeai-api.p.rapidapi.com/v1/parse', false,
  stream_context_create([
    'http' => [
      'method' => 'POST',
      'header' => implode("\r\n", [
        'X-RapidAPI-Key: YOUR_KEY',
        'X-RapidAPI-Host: resumeai-api.p.rapidapi.com',
        'Content-Type: application/json',
      ]),
      'content' => json_encode([
        'file' => $fileB64,
        'file_type' => 'pdf',
        'language' => 'auto',
      ]),
    ],
  ])
);
$data = json_decode($response, true)['data'];
echo $data['personal']['nombre_completo'];
```

---

### POST /v1/score

**Python**
```python
response = requests.post(
    "https://resumeai-api.p.rapidapi.com/v1/score",
    headers={...},
    json={
        "cv": cv_text,
        "cv_type": "text",
        "job_description": "Buscamos Desarrollador Python Senior con 5+ años...",
        "scoring_weights": {
            "skills_tecnicas": 40,
            "experiencia": 30,
            "educacion": 15,
            "idiomas": 15
        }
    },
)
result = response.json()["data"]
print(f"Score: {result['score_total']}/100 — {result['nivel_match']}")
print(f"Contratar: {result['contratar']}")
print(f"Gaps: {result['brechas']}")
```

**JavaScript**
```javascript
const result = await fetch('https://resumeai-api.p.rapidapi.com/v1/score', {
  method: 'POST',
  headers: { 'X-RapidAPI-Key': 'YOUR_KEY', ... },
  body: JSON.stringify({
    cv: cvText,
    cv_type: 'text',
    job_description: jobDesc,
  }),
}).then(r => r.json());

console.log(`Score: ${result.data.score_total} — Hire: ${result.data.contratar}`);
```

---

### POST /v1/rank

**Python**
```python
import os, base64

cvs = []
for i, filename in enumerate(os.listdir('./cvs')):
    with open(f'./cvs/{filename}', 'rb') as f:
        cvs.append({
            "id": f"cv_{i+1:03d}",
            "content": base64.b64encode(f.read()).decode(),
            "type": "pdf"
        })

response = requests.post(
    "https://resumeai-api.p.rapidapi.com/v1/rank",
    headers={...},
    json={
        "cvs": cvs[:20],  # max 20
        "job_description": "Senior Python Developer...",
        "top_n": 5
    }
)
ranking = response.json()["data"]["ranking"]
for r in ranking:
    print(f"#{r['posicion']} {r['candidato']} — {r['score']}/100")
    print(f"   {r['razon_principal']}")
```

---

## Error Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "El tipo de archivo no está soportado. Use: pdf, docx, text",
    "docs_url": "https://rapidapi.com/resumeai/resumeai-api/docs"
  }
}
```

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_API_KEY` | 401 | Missing or invalid RapidAPI key |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests, upgrade plan |
| `INVALID_FILE_TYPE` | 400 | Use: pdf, docx, text |
| `FILE_TOO_LARGE` | 400 | Max 5MB |
| `PARSE_FAILED` | 422 | Could not extract/parse content |
| `INVALID_PAYLOAD` | 400 | Validation error, check request body |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## FAQ

**Q: What languages are supported?**
A: Spanish (all Latin American variants) and English. Set `language: "auto"` to detect automatically.

**Q: What file formats are supported?**
A: PDF, DOCX, and plain text. Files are sent as base64-encoded strings in the JSON body.

**Q: What's the maximum file size?**
A: 5MB per file. Most CVs are well under 1MB.

**Q: How many CVs can I rank at once?**
A: Up to 20 CVs per `/v1/rank` request. For larger batches, split into multiple requests.

**Q: Do you store CVs or candidate data?**
A: No. CVs are processed in memory and never stored. We do not log CV content.

---

## Deploy (Railway)

```bash
# 1. Fork/clone this repo
# 2. Connect to Railway
railway login
railway init
railway add

# 3. Set environment variables in Railway dashboard:
#    ANTHROPIC_API_KEY, RAPIDAPI_PROXY_SECRET, NODE_ENV=production

# 4. Deploy
railway up
```

## Deploy (Render)

1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Add environment variables from `.env.example`
