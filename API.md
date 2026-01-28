# 7esen TV CMS - API Documentation

## 🔗 Base URLs
```
Production: https://7esentvbackend.vercel.app
Local Dev:  http://localhost:3000
```

---

## 📱 For Flutter Developers

### ⚠️ Strict Premium Content Logic (CRITICAL)

The API strictly hides premium URLs to prevent unauthorized access.

| Type | Premium Condition | Response Behavior |
|------|-------------------|-------------------|
| **Free Link** | `is_premium: false` | Full `url` property is present ✅ |
| **Premium Link**| `is_premium: true` | **`url` property is COMPLETELY OMITTED** 🔒 |

**Example Public JSON:**
```json
"stream_link": [
  { "name": "Server 1 (Free)", "is_premium": false, "url": "https://..." },
  { "name": "Server 2 (Premium)", "is_premium": true } // URL KEY IS GONE
]
```

---

### 📦 Dart Models

```dart
class StreamLink {
  final String name;
  final bool isPremium;
  final String? url; // null if omitted from JSON

  StreamLink.fromJson(Map<String, dynamic> json) :
    name = json['name'] ?? 'Stream',
    isPremium = json['is_premium'] ?? false,
    url = json['url']; // Will be null if key is missing
}

class Channel {
  final int id;
  final String name;
  final Map<String, dynamic>? logo;
  final List<dynamic> categories;
  final List<StreamLink> streamLink;

  Channel.fromJson(Map<String, dynamic> json) : 
    id = json['id'],
    name = json['name'],
    logo = json['logo'],
    categories = json['categories'] ?? [],
    streamLink = (json['stream_link'] as List).map((s) => StreamLink.fromJson(s)).toList();
}

class Match {
  final int id;
  final String teamA;
  final String teamB;
  final Map<String, dynamic>? logoA;
  final Map<String, dynamic>? logoB;
  final String matchTime; // "HH:MM"
  final String? channel;
  final String? commentator;
  final String? champion;
  final bool isPremium;
  final List<StreamLink> streamLink;

  Match.fromJson(Map<String, dynamic> json) :
    id = json['id'],
    teamA = json['team_a'],
    teamB = json['team_b'],
    logoA = json['logo_a'],
    logoB = json['logo_b'],
    matchTime = json['match_time'] ?? '',
    channel = json['channel'],
    commentator = json['commentator'],
    champion = json['champion'],
    isPremium = json['is_premium'] ?? false,
    streamLink = (json['stream_link'] as List? ?? []).map((s) => StreamLink.fromJson(s)).toList();
}
```

---

## 📱 Mobile API (Public - No Auth)

### 1. Get Channels
`GET /api/mobile/channels`
- **Returns:** All published channels.
- **Dating Hiding:** If a channel belongs to a premium category, its old-format links are hidden. New formats are hidden per-link.

### 2. Get Matches
`GET /api/mobile/matches`
- **Returns:** All published matches.
- **Fields:** `id`, `team_a`, `team_b`, `logo_a`, `logo_b`, `match_time`, `channel`, `commentator`, `champion`, `is_premium`, `stream_link`.
- **Note:** `match_time` is a string (e.g., "20:45").

### 3. Get Categories
`GET /api/mobile/categories`
- **Fields:** `id`, `name`, `is_premium`, `sort_order`. Use `sort_order` to display them.

### 4. Get Goals
`GET /api/mobile/goals`
- **Fields:** `id`, `title`, `image`, `url`, `is_premium`.
- **Logic:** If `is_premium` is true, the `url` field is omitted.

### 5. Get News
`GET /api/mobile/news`
- **Fields:** `id`, `title`, `image`, `link`, `is_premium`.
- **Logic:** Link is omitted if premium.

---

## 🔐 Premium Access API (Auth Required)

### Unlock Content
`POST /api/mobile/premium`

**Headers:**
`Authorization: Bearer <FIREBASE_ID_TOKEN>`

**Body:**
```json
{
  "type": "channel", // or "match", "goal", "news"
  "id": 123
}
```

**Workflow:**
1. Backend verifies Token.
2. Backend checks Firestore subscription.
3. **If Subscribed:** Returns full object with ALL URLs.
4. **If Not Subscribed:** Returns object with ONLY Free URLs (Premium URLs are omitted).

**Response (Success - Premium User):**
```json
{
  "success": true,
  "is_subscribed": true,
  "data": {
    "id": 123,
    "name": "beIN Sports 1",
    "stream_link": [
      {"name": "FHD", "url": "https://...", "is_premium": false},
      {"name": "4K Premium", "url": "https://...", "is_premium": true}
    ]
  }
}
```

**Response (Success - Free User):**
```json
{
  "success": true,
  "is_subscribed": false,
  "data": {
    "id": 123,
    "name": "beIN Sports 1",
    "stream_link": [
      {"name": "FHD", "url": "https://...", "is_premium": false},
      {"name": "4K Premium", "is_premium": true} // URL Hidden
    ]
  }
}
```

---

## 🛠️ CMS Dashboard (Server Actions)

These are used by the Next.js admin panel (`src/app/actions.ts`).

### Data Structures

#### Cloudinary Image
```typescript
{
  url: string;
  public_id: string;
  width: number;
  height: number;
}
```

#### Stream Item
```typescript
{
  name: string;
  url: string;
  is_premium: boolean;
}
```

---

## ⚙️ Environment Variables (.env.local)

```env
# Database
DATABASE_HOST=...
DATABASE_PORT=6543
DATABASE_NAME=postgres
DATABASE_USERNAME=...
DATABASE_PASSWORD=...

# Firebase Admin SDK (For Premium API)
FIREBASE_PROJECT_ID=esen-notifications
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Cloudinary
CLOUDINARY_NAME=...
CLOUDINARY_KEY=...
CLOUDINARY_SECRET=...
```
