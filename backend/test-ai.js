require('dotenv').config();
const { generateProposal } = require('./services/aiService');

async function testAI() {
  try {
    console.log('Testing AI service...');
    const result = await generateProposal('Test prompt for generating a simple proposal', false);
    console.log('✅ AI service working:', result);
  } catch (error) {
    console.error('❌ AI service error:', error.message);
    console.error('Full error:', error);
  }
}

testAI();
