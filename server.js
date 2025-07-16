const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

// Create Express  app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'url_shortener'
};

// Create MySQL connection
const db = mysql.createConnection(dbConfig);

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Create database if it doesn't exist
  db.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`, (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return;
    }
    console.log('Database created or already exists');
    
    // Use the database
    db.query(`USE ${dbConfig.database}`, (err) => {
      if (err) {
        console.error('Error selecting database:', err);
        return;
      }
      
      // Create urls table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS urls (
          id INT AUTO_INCREMENT PRIMARY KEY,
          original_url VARCHAR(2048) NOT NULL,
          short_code VARCHAR(10) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          clicks INT DEFAULT 0
        )
      `;
      
      db.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          return;
        }
        console.log('URLs table created or already exists');
      });
    });
  });
});

// Helper function to generate short code
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Routes

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'URL Shortener API',
    endpoints: {
      'POST /shorten': 'Create a short URL',
      'GET /:code': 'Redirect to original URL',
      'GET /api/stats/:code': 'Get URL statistics',
      'GET /api/urls': 'Get all URLs'
    }
  });
});

// Create short URL
app.post('/shorten', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Basic URL validation
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  
  const shortCode = generateShortCode();
  
  const query = 'INSERT INTO urls (original_url, short_code) VALUES (?, ?)';
  db.query(query, [url, shortCode], (err, result) => {
    if (err) {
      console.error('Error inserting URL:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      original_url: url,
      short_code: shortCode,
      short_url: `${req.protocol}://${req.get('host')}/${shortCode}`,
      id: result.insertId
    });
  });
});

// Redirect to original URL
app.get('/:code', (req, res) => {
  const { code } = req.params;
  
  const query = 'SELECT * FROM urls WHERE short_code = ?';
  db.query(query, [code], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    
    const url = results[0];
    
    // Update click count
    const updateQuery = 'UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?';
    db.query(updateQuery, [code], (err) => {
      if (err) {
        console.error('Error updating clicks:', err);
      }
    });
    
    // Redirect to original URL
    res.redirect(url.original_url);
  });
});

// Get URL statistics
app.get('/api/stats/:code', (req, res) => {
  const { code } = req.params;
  
  const query = 'SELECT * FROM urls WHERE short_code = ?';
  db.query(query, [code], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    
    const url = results[0];
    res.json({
      id: url.id,
      original_url: url.original_url,
      short_code: url.short_code,
      created_at: url.created_at,
      clicks: url.clicks
    });
  });
});

// Get all URLs
app.get('/api/urls', (req, res) => {
  const query = 'SELECT * FROM urls ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Delete URL
app.delete('/api/urls/:code', (req, res) => {
  const { code } = req.params;
  
  const query = 'DELETE FROM urls WHERE short_code = ?';
  db.query(query, [code], (err, result) => {
    if (err) {
      console.error('Error deleting URL:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    
    res.json({ message: 'URL deleted successfully' });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.end((err) => {
    if (err) {
      console.error('Error closing database connection:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
}); 