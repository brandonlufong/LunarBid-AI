// backend/scripts/seedTestUsers.js
// Creates/updates one test user per plan so we can verify plan-gated features.
// Run: node scripts/seedTestUsers.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const PASSWORD = 'Test1234!';

const USERS = [
  { plan: 'free',    name: 'Free Tester',    email: 'free@lunarbid.test' },
  { plan: 'starter', name: 'Starter Tester', email: 'starter@lunarbid.test' },
  { plan: 'pro',     name: 'Pro Tester',     email: 'pro@lunarbid.test' },
  { plan: 'agency',  name: 'Agency Tester',  email: 'agency@lunarbid.test' },
];

const PROFILE = {
  role: 'Full-Stack Web Developer',
  skills: 'React, Node.js, Shopify, UI/UX, Tailwind, MongoDB',
  experience: '6 years building high-converting web apps and e-commerce stores',
  hourlyRate: '$60/hr',
  bio: 'I help brands turn ideas into fast, beautiful, revenue-driving products.',
};

(async () => {
  await connectDB();
  for (const u of USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = new User({ name: u.name, email: u.email, password: PASSWORD });
    } else {
      user.password = PASSWORD; // re-set so we know the login
    }
    user.name = u.name;
    user.profile = { ...user.profile, ...PROFILE };
    user.subscription.plan = u.plan;
    user.subscription.status = 'active';
    // reset usage so limit tests start clean
    user.usage.proposalsToday = 0;
    user.usage.proposalsThisMonth = 0;
    user.usage.lastResetDate = new Date();
    user.usage.monthlyResetDate = new Date();
    await user.save();
    console.log(`✅ ${u.plan.padEnd(8)} -> ${u.email}  (pw: ${PASSWORD})`);
  }
  console.log('\nDone. Login with any of the above.');
  await mongoose.connection.close();
  process.exit(0);
})().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
