require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());

// ========================================
// CRITICAL: Webhook route MUST be BEFORE express.json()
// This is because Stripe needs the raw body for signature verification
// ========================================
app.use('/api/subscription/webhook', 
  express.raw({ type: 'application/json' }),
  require('./routes/subscription')
);

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/branding', require('./routes/branding'));
app.use('/api/client-profiles', require('./routes/clientProfiles'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/support', require('./routes/support'));

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
