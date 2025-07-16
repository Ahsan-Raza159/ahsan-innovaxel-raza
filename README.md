# URL Shortener - Node.js + Express + MySQL

A simple URL shortener service built with Node.js, Express, and MySQL.

## Features

- Shorten long URLs
- Track click statistics
- Redirect to original URLs
- RESTful API endpoints
- MySQL database integration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Make sure you have MySQL installed and running on your system.

Create a `.env` file in the root directory with the following configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=url_shortener
PORT=3000
```

**Note**: The application will automatically create the database and table if they don't exist.

### 3. Run the Application

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### GET /
- **Description**: Welcome message with API documentation
- **Response**: JSON with available endpoints

### POST /shorten
- **Description**: Create a short URL
- **Body**: `{ "url": "https://example.com" }`
- **Response**: 
```json
{
  "original_url": "https://example.com",
  "short_code": "abc123",
  "short_url": "http://localhost:3000/abc123",
  "id": 1
}
```

### GET /:code
- **Description**: Redirect to original URL
- **Example**: `GET /abc123`
- **Response**: Redirects to the original URL

### GET /api/stats/:code
- **Description**: Get URL statistics
- **Example**: `GET /api/stats/abc123`
- **Response**:
```json
{
  "id": 1,
  "original_url": "https://example.com",
  "short_code": "abc123",
  "created_at": "2023-01-01T00:00:00.000Z",
  "clicks": 5
}
```

### GET /api/urls
- **Description**: Get all URLs
- **Response**: Array of all shortened URLs

### DELETE /api/urls/:code
- **Description**: Delete a shortened URL
- **Example**: `DELETE /api/urls/abc123`
- **Response**: `{ "message": "URL deleted successfully" }`

## Example Usage

### Using curl:

```bash
# Create a short URL
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com"}'

# Get statistics
curl http://localhost:3000/api/stats/abc123

# Get all URLs
curl http://localhost:3000/api/urls
```

### Using JavaScript (fetch):

```javascript
// Create a short URL
fetch('http://localhost:3000/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ url: 'https://www.google.com' })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Database Schema

The application uses a simple `urls` table:

```sql
CREATE TABLE urls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_url VARCHAR(2048) NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  clicks INT DEFAULT 0
);
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid URL)
- `404`: Short URL not found
- `500`: Internal server error

## Dependencies

- **express**: Web framework for Node.js
- **mysql2**: MySQL database driver
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **nodemon**: Development dependency for auto-restart

## Notes

- Short codes are 6 characters long by default
- The application automatically creates the database and table on startup
- Click tracking is implemented for analytics
- CORS is enabled for cross-origin requests 
