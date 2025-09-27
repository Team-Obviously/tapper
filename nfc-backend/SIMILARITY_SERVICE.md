# User Similarity Service

A production-grade user similarity service that calculates similarity scores between users based on their profile data using Jaccard similarity and weighted field matching.

## Features

- **Jaccard Similarity**: Calculates similarity for array fields (interests) using set intersection/union
- **Weighted Scoring**: Configurable field weights for different profile attributes
- **Database Integration**: Fetches user data directly from PostgreSQL using Drizzle ORM
- **RESTful API**: Clean REST endpoints with proper error handling
- **Input Validation**: Comprehensive validation using Zod schemas
- **Type Safety**: Full TypeScript support with proper type definitions

## API Endpoints

### 1. Health Check
```
GET /api/similarity/health
```
Returns the health status of the similarity service.

**Response:**
```json
{
  "success": true,
  "service": "similarity-service",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Calculate Similarity Between Two Users
```
GET /api/similarity/get-similarity?userId1={uuid}&userId2={uuid}
```

**Parameters:**
- `userId1` (required): UUID of the first user
- `userId2` (required): UUID of the second user

**Response:**
```json
{
  "success": true,
  "data": {
    "similarity": 0.75,
    "profileMatching": [
      "skillLevel",
      "availability", 
      "interests",
      "company",
      "experience",
      "isHiring",
      "position",
      "data",
      "resumeUrl"
    ],
    "user1": {
      "id": "user-uuid-1",
      "profile": {
        "interests": ["Football", "Running"],
        "skillLevel": "Expert",
        "availability": "Weekends",
        "company": "Acme Corp",
        "position": "Manager",
        "experience": "10+ years",
        "isHiring": "true",
        "resumeUrl": "https://example.com/resume",
        "data": {}
      }
    },
    "user2": {
      "id": "user-uuid-2",
      "profile": {
        "interests": ["Football", "Basketball"],
        "skillLevel": "Expert",
        "availability": "Weekends",
        "company": "Beta Inc",
        "position": "Engineer",
        "experience": "5+ years",
        "isHiring": "false",
        "resumeUrl": null,
        "data": {}
      }
    }
  },
  "message": "Similarity calculated successfully"
}
```

### 3. Get Similar Users
```
GET /api/similarity/similar-users/{userId}?minSimilarity=0.3&limit=10
```

### 4. Get Interest-Based Connections
```
GET /api/similarity/interest-connections/{userId}
```

**Parameters:**
- `userId` (required): UUID of the user to find interest-based connections for

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid-1",
    "similarity": [
      {
        "interest": "Football",
        "connectedUsers": [
          {
            "userId": "user-uuid-2",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "location": "New York",
            "interests": ["Football", "Basketball"],
            "skillLevel": "Expert",
            "availability": "Weekends",
            "company": "Tech Corp",
            "position": "Engineer",
            "experience": "5+ years",
            "isHiring": "false",
            "resumeUrl": "https://example.com/resume",
            "data": {},
            "createdAt": "2024-01-15T10:30:00.000Z"
          },
          {
            "userId": "user-uuid-3",
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane@example.com",
            "phone": "+0987654321",
            "location": "Los Angeles",
            "interests": ["Football", "Tennis"],
            "skillLevel": "Intermediate",
            "availability": "Weekdays",
            "company": "Design Inc",
            "position": "Designer",
            "experience": "3+ years",
            "isHiring": "true",
            "resumeUrl": null,
            "data": {},
            "createdAt": "2024-01-20T14:45:00.000Z"
          }
        ]
      },
      {
        "interest": "Basketball",
        "connectedUsers": [
          {
            "userId": "user-uuid-2",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "location": "New York",
            "interests": ["Football", "Basketball"],
            "skillLevel": "Expert",
            "availability": "Weekends",
            "company": "Tech Corp",
            "position": "Engineer",
            "experience": "5+ years",
            "isHiring": "false",
            "resumeUrl": "https://example.com/resume",
            "data": {},
            "createdAt": "2024-01-15T10:30:00.000Z"
          }
        ]
      }
    ]
  },
  "message": "Interest-based connections retrieved successfully"
}
```

### 5. Get Similar Users (Original)
```
GET /api/similarity/similar-users/{userId}?minSimilarity=0.3&limit=10
```

**Parameters:**
- `userId` (required): UUID of the user to find similar users for
- `minSimilarity` (optional): Minimum similarity threshold (0-1), default: 0.3
- `limit` (optional): Maximum number of results (1-50), default: 10

**Response:**
```json
{
  "success": true,
  "data": {
    "targetUserId": "user-uuid-1",
    "similarUsers": [
      {
        "userId": "user-uuid-2",
        "similarity": 0.75,
        "profile": {
          "interests": ["Football", "Basketball"],
          "skillLevel": "Expert",
          "availability": "Weekends",
          "company": "Beta Inc",
          "position": "Engineer",
          "experience": "5+ years",
          "isHiring": "false",
          "resumeUrl": null,
          "data": {}
        }
      }
    ],
    "count": 1,
    "minSimilarity": 0.3,
    "limit": 10
  },
  "message": "Similar users retrieved successfully"
}
```

## Response Fields

### `similarity`
The overall similarity score between 0.0 and 1.0, calculated using weighted field comparisons.

### `profileMatching`
An array of field names ordered from most similar to least similar. This shows which profile fields contributed most to the similarity score. The ordering is based on the raw similarity score for each field (not the weighted score).

**Example ordering:**
- Fields with 1.0 similarity (perfect match) appear first
- Fields with 0.0 similarity (no match) appear last
- Fields are sorted by their individual similarity scores in descending order

## Interest-Based Connections

The interest-based connections endpoint provides a different approach to finding user relationships by grouping users who share specific interests with the target user.

### How It Works
1. **Target User Analysis**: Fetches the target user's interests from their profile
2. **Interest Grouping**: For each interest, finds all other users who also have that interest
3. **Connection Mapping**: Groups users by shared interests, creating a many-to-many relationship
4. **Ordered Results**: Returns interests sorted by the number of connected users (most popular first)

### Use Cases
- **Interest Discovery**: Find users who share specific hobbies or activities
- **Community Building**: Create interest-based user groups
- **Recommendation Systems**: Suggest users based on shared interests
- **Social Networking**: Connect users with similar passions

### Response Structure
- `user_id`: The target user's ID
- `similarity`: Array of interest groups
  - `interest`: The name of the shared interest
  - `connectedUsers`: Array of complete user profiles who share this interest
    - `userId`: The connected user's ID
    - `firstName`: User's first name
    - `lastName`: User's last name
    - `email`: User's email address
    - `phone`: User's phone number
    - `location`: User's location
    - `interests`: Array of user's interests
    - `skillLevel`: User's skill level
    - `availability`: User's availability
    - `company`: User's company
    - `position`: User's position
    - `experience`: User's experience level
    - `isHiring`: Whether user is hiring
    - `resumeUrl`: URL to user's resume
    - `data`: Additional user data
    - `createdAt`: User account creation timestamp

## Similarity Algorithm

The similarity calculation uses a weighted approach combining multiple field comparisons:

### Field Weights
- **Interests**: 40% - Uses Jaccard similarity for array comparison
- **Skill Level**: 20% - Exact text match
- **Availability**: 15% - Exact text match
- **Company**: 5% - Exact text match
- **Position**: 5% - Exact text match
- **Experience**: 5% - Exact text match
- **Is Hiring**: 5% - Boolean match
- **Resume URL**: 0% - Usually ignored
- **Data**: 5% - Custom JSON comparison

### Jaccard Similarity
For array fields (like interests), the Jaccard similarity coefficient is used:
```
J(A, B) = |A ∩ B| / |A ∪ B|
```

### Final Score
The final similarity score is calculated as:
```
Total Score = Σ(field_similarity × field_weight)
```

## Error Handling

The service provides comprehensive error handling for common scenarios:

- **400 Bad Request**: Invalid parameters, missing required fields
- **404 Not Found**: User not found in database
- **500 Internal Server Error**: Database errors, unexpected failures

### Error Response Format
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": {} // Additional error details (for validation errors)
}
```

## Usage Examples

### Using curl

```bash
# Health check
curl http://localhost:3000/api/similarity/health

# Get similarity between two users
curl "http://localhost:3000/api/similarity/get-similarity?userId1=uuid1&userId2=uuid2"

# Get similar users
curl "http://localhost:3000/api/similarity/similar-users/uuid1?minSimilarity=0.5&limit=5"

# Get interest-based connections
curl "http://localhost:3000/api/similarity/interest-connections/uuid1"
```

### Using JavaScript/Node.js

```javascript
// Calculate similarity between two users
const response = await fetch(
  'http://localhost:3000/api/similarity/get-similarity?userId1=uuid1&userId2=uuid2'
);
const data = await response.json();
console.log('Similarity score:', data.data.similarity);
console.log('Profile matching fields:', data.data.profileMatching);

// Get similar users
const similarUsersResponse = await fetch(
  'http://localhost:3000/api/similarity/similar-users/uuid1?minSimilarity=0.3&limit=10'
);
const similarUsers = await similarUsersResponse.json();
console.log('Similar users:', similarUsers.data.similarUsers);

// Get interest-based connections
const interestConnectionsResponse = await fetch(
  'http://localhost:3000/api/similarity/interest-connections/uuid1'
);
const interestConnections = await interestConnectionsResponse.json();
console.log('Interest connections:', interestConnections.data.similarity);
// Example: [{"interest": "Football", "connectedUsers": [{"userId": "user-1", "firstName": "John", ...}]}, ...]
```

## Testing

Run the test script to verify the endpoints:

```bash
# Start the server
npm run dev

# In another terminal, run the test
node test-similarity.js
```

## Database Schema

The service expects the following user table structure:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  location TEXT,
  interests JSONB, -- Array of sports interests
  skill_level TEXT,
  availability TEXT,
  company TEXT,
  position TEXT,
  experience TEXT,
  is_hiring TEXT DEFAULT 'false',
  resume_url TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## Configuration

The service uses the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3000)

## Dependencies

- **Express.js**: Web framework
- **Drizzle ORM**: Database ORM
- **Zod**: Schema validation
- **TypeScript**: Type safety
- **PostgreSQL**: Database

## Performance Considerations

- Database queries are optimized with proper indexing
- Similarity calculations are performed in-memory for better performance
- Results are limited to prevent large response payloads
- Input validation prevents unnecessary database queries

## Future Enhancements

- Caching layer for frequently accessed user profiles
- Batch similarity calculations
- Machine learning-based similarity algorithms
- Real-time similarity updates
- Similarity score history tracking
