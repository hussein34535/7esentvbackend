# 7esen TV CMS - API Documentation

## Overview
This is a Next.js application with Server Actions for the CMS dashboard and API routes for the mobile app.

## 🔗 Base URL
```
Production: https://7esentvbackend.vercel.app
Local Dev:  http://localhost:3000
```

---

## 📱 For Flutter Developers

### Quick Start
1. Use the **Mobile API** endpoints below
2. All endpoints return JSON with `{ success: true, data: [...] }`
3. **Premium content URLs are hidden** (`url: null`) - see Premium Access section

### Dart Models
```dart
class Channel {
  final int id;
  final String name;
  final Map<String, dynamic>? logo;
  final List<Category> categories;
  final List<StreamLink> streamLink;

  Channel.fromJson(Map<String, dynamic> json) : 
    id = json['id'],
    name = json['name'],
    logo = json['logo'],
    categories = (json['categories'] as List).map((c) => Category.fromJson(c)).toList(),
    streamLink = (json['stream_link'] as List).map((s) => StreamLink.fromJson(s)).toList();
}

class StreamLink {
  final String name;
  final bool isPremium;
  final String? url; // null if premium and user not subscribed

  StreamLink.fromJson(Map<String, dynamic> json) :
    name = json['name'],
    isPremium = json['is_premium'] ?? false,
    url = json['url'];
}

class Match {
  final int id;
  final String teamA;
  final String teamB;
  final Map<String, dynamic>? logoA;
  final Map<String, dynamic>? logoB;
  final String matchTime;
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
    matchTime = json['match_time'],
    channel = json['channel'],
    commentator = json['commentator'],
    champion = json['champion'],
    isPremium = json['is_premium'] ?? false,
    streamLink = (json['stream_link'] as List).map((s) => StreamLink.fromJson(s)).toList();
}

class Category {
  final int id;
  final String name;
  final bool isPremium;
  final int sortOrder;

  Category.fromJson(Map<String, dynamic> json) :
    id = json['id'],
    name = json['name'],
    isPremium = json['is_premium'] ?? false,
    sortOrder = json['sort_order'] ?? 0;
}
```

---

## Authentication

### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```
**Response:**
- `200 OK` - Sets `admin_logged_in` cookie
- `401 Unauthorized` - Invalid credentials

### Logout
```
POST /api/auth/logout
```
**Response:**
- `200 OK` - Clears authentication cookie

---

## 📱 Mobile API (Public - No Auth Required)

These APIs are designed for the mobile app.

### ⚠️ Premium Content Logic

Each **stream link** has its own `is_premium` flag:

| `is_premium` | `url` in Response |
|--------------|-------------------|
| `false` | Full URL shown ✅ |
| `true` | `null` (hidden) 🔒 |

**Example:**
```json
"stream_link": [
  { "name": "FHD", "is_premium": false, "url": "https://example.com/fhd.m3u8" },
  { "name": "4K Premium", "is_premium": true, "url": null }
]
```

> **Note:** The premium flag is set **per stream** in the CMS, not per channel/match.

---

### Get Channels
```
GET /api/mobile/channels
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "beIN Sports 1",
      "logo": {...},
      "categories": [{"id": 1, "name": "Sports", "is_premium": false}],
      "stream_link": [
        {"name": "FHD", "is_premium": false, "url": "https://..."},
        {"name": "4K Premium", "is_premium": true, "url": null}
      ]
    }
  ]
}
```

### Get Matches
```
GET /api/mobile/matches
```
**Response:** Same pattern - premium stream URLs are `null`

### Get Categories
```
GET /api/mobile/categories
```
**Response:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "Sports", "is_premium": false, "sort_order": 1}
  ]
}
```

### Get Goals
```
GET /api/mobile/goals
```
**Response:** Premium goal URLs are `null`

### Get News
```
GET /api/mobile/news
```
**Response:** Premium news links are `null`

---

## 🔐 Premium Access API (Auth Required)

Use this endpoint to get **full premium content URLs** for subscribed users.

### Unlock Premium Content
```
POST /api/mobile/premium
```

**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**Body:**
```json
{
  "type": "channel",  // or "match", "goal", "news"
  "id": 123
}
```

**Response (Success - Premium User):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "beIN Sports 1",
    "stream_link": [
      {"name": "FHD", "url": "https://actual-stream-url.m3u8", "is_premium": false},
      {"name": "4K Premium", "url": "https://premium-stream-url.m3u8", "is_premium": true}
    ]
  }
}
```

**Response (Error - Not Premium):**
```json
{
  "success": false,
  "error": "User is not a premium subscriber"
}
```

### Flutter Example
```dart
Future<Map<String, dynamic>?> unlockPremiumContent(String type, int id) async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) return null;

  final token = await user.getIdToken();
  
  final response = await http.post(
    Uri.parse('$baseUrl/api/mobile/premium'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'type': type, 'id': id}),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body)['data'];
  }
  return null;
}
```

---

## Server Actions (Used by CMS Dashboard)

These are Next.js Server Actions imported from `src/app/actions.ts`.
They are NOT traditional REST APIs, but direct function calls from the frontend.

---

### Matches

| Action | Description |
|--------|-------------|
| `getMatches()` | Get all matches |
| `getMatch(id)` | Get single match by ID |
| `createMatch(data)` | Create new match |
| `updateMatch(id, data)` | Update existing match |
| `deleteMatch(id)` | Delete match |

**Match Data Fields:**
```typescript
{
  team_a: string;
  team_b: string;
  match_time: string;      // Format: "HH:MM"
  channel: string;
  commentator: string;
  champion: string;
  logo_a: CloudinaryAsset;
  logo_b: CloudinaryAsset;
  stream_link: StreamItem[]; // Array of {name, url, is_premium}
  is_premium: boolean;
  is_published: boolean;
}
```

---

### Channels

| Action | Description |
|--------|-------------|
| `getChannels()` | Get all channels |
| `getChannel(id)` | Get single channel with categories |
| `createChannel(data)` | Create new channel |
| `updateChannel(id, data)` | Update existing channel |
| `deleteChannel(id)` | Delete channel |

**Channel Data Fields:**
```typescript
{
  name: string;
  stream_link: StreamItem[]; // Array of {name, url, is_premium}
  category_ids: number[];    // Array of category IDs
}
```

---

### Categories

| Action | Description |
|--------|-------------|
| `getCategories()` | Get all categories |
| `getCategory(id)` | Get single category with channels |
| `createCategory(data)` | Create new category |
| `updateCategory(id, data)` | Update existing category |
| `deleteCategory(id)` | Delete category |

**Category Data Fields:**
```typescript
{
  name: string;
  is_premium: boolean;
  sort_order?: number;
  channel_ids?: number[];  // Array of channel IDs
}
```

---

### Goals

| Action | Description |
|--------|-------------|
| `getGoals()` | Get all goals |
| `getGoal(id)` | Get single goal by ID |
| `createGoal(data)` | Create new goal |
| `updateGoal(id, data)` | Update existing goal |
| `deleteGoal(id)` | Delete goal |

**Goal Data Fields:**
```typescript
{
  title: string;
  image: CloudinaryAsset;
  url: any;              // Video URL or embed
  is_premium: boolean;
  is_published: boolean;
}
```

---

### News

| Action | Description |
|--------|-------------|
| `getNews()` | Get all news |
| `getNewsItem(id)` | Get single news item by ID |
| `createNews(data)` | Create new news item |
| `updateNews(id, data)` | Update existing news item |
| `deleteNews(id)` | Delete news item |

**News Data Fields:**
```typescript
{
  title: string;
  image: CloudinaryAsset;
  link: any;             // Article/video link
  is_premium: boolean;
  is_published: boolean;
}
```

---

## Other API Routes

### Sign Cloudinary
```
POST /api/sign-cloudinary
```
Signs upload requests for Cloudinary media uploads.

---

## Environment Variables

```env
# Database
DATABASE_HOST=
DATABASE_PORT=
DATABASE_NAME=
DATABASE_USERNAME=
DATABASE_PASSWORD=

# Cloudinary
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=

# Admin Auth
ADMIN_USERNAME=
ADMIN_PASSWORD=
```

---

## Database Schema

See `schema.sql` for full database structure.

**Tables:**
- `channels` - TV channels
- `channel_categories` - Category groups
- `_rel_channels_categories` - Many-to-many relation
- `matches` - Live matches
- `goals` - Goal videos
- `news` - News articles
