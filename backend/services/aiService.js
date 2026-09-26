// backend/services/aiService.js
const Groq = require('groq-sdk');
const axios = require('axios');

// Groq client, created on first use so the API still starts when only other
// providers are configured. Explicit timeout so a slow provider can't stall a request.
let groq = null;
const groqClient = () =>
  groq || (groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 30000, maxRetries: 0 }));

// ===============================
// Provider 1: Groq (Primary - Free & Fast)
// ===============================
const generateWithGroq = async (prompt, isPriority = false) => {
  try {
    const maxTokens = isPriority ? 2500 : 2000;
    
    const completion = await groqClient().chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert freelance proposal writer who creates compelling, personalized proposals that win clients.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      // FIXED: Updated to current model
      model: 'llama-3.3-70b-versatile', // Latest Groq model (Dec 2024)
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.9,
      stream: false
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Groq API Error:', error.message);
    throw error;
  }
};

// ===============================
// Provider 2: Together AI (Fallback 1 - Cheap & Reliable)
// ===============================
const generateWithTogether = async (prompt, isPriority = false) => {
  try {
    const maxTokens = isPriority ? 2500 : 2000;
    
    const response = await axios.post(
      // FIXED: Correct API endpoint
      'https://api.together.ai/v1/chat/completions',
      {
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert freelance proposal writer who creates compelling, personalized proposals that win clients.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Together AI Error:', error.response?.data || error.message);
    throw error;
  }
};

// ===============================
// Provider 3: OpenRouter (Fallback 2 - Multi-model)
// ===============================
const generateWithOpenRouter = async (prompt, isPriority = false) => {
  try {
    const maxTokens = isPriority ? 2500 : 2000;
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an expert freelance proposal writer who creates compelling, personalized proposals that win clients.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'https://lunarbid.com',
          'X-Title': 'LunarBid',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenRouter Error:', error.response?.data || error.message);
    throw error;
  }
};

// ===============================
// Provider 4: Anthropic Claude (Fallback 3 - Premium Quality)
// ===============================
const generateWithClaude = async (prompt, isPriority = false) => {
  try {
    const maxTokens = isPriority ? 2500 : 2000;
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-haiku-20241022', // Latest Haiku model
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: `You are an expert freelance proposal writer who creates compelling, personalized proposals that win clients.\n\n${prompt}`
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.content[0].text.trim();
  } catch (error) {
    console.error('Anthropic API Error:', error.response?.data || error.message);
    throw error;
  }
};

// ===============================
// Provider 5: OpenAI (Fallback 4 - If you have it)
// ===============================
const generateWithOpenAI = async (prompt, isPriority = false) => {
  try {
    const maxTokens = isPriority ? 2500 : 2000;
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // Cheap and good quality
        messages: [
          {
            role: 'system',
            content: 'You are an expert freelance proposal writer who creates compelling, personalized proposals that win clients.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI Error:', error.response?.data || error.message);
    throw error;
  }
};

// ===============================
// Main Function with Smart Fallback System
// ===============================
const generateProposal = async (prompt, isPriority = false) => {
  const providers = [
    { name: 'Groq', fn: generateWithGroq, enabled: !!process.env.GROQ_API_KEY },
    { name: 'Together AI', fn: generateWithTogether, enabled: !!process.env.TOGETHER_API_KEY },
    { name: 'OpenRouter', fn: generateWithOpenRouter, enabled: !!process.env.OPENROUTER_API_KEY },
    { name: 'OpenAI', fn: generateWithOpenAI, enabled: !!process.env.OPENAI_API_KEY },
    { name: 'Claude', fn: generateWithClaude, enabled: !!process.env.ANTHROPIC_API_KEY }
  ];

  // Filter to only enabled providers
  const enabledProviders = providers.filter(p => p.enabled);

  if (enabledProviders.length === 0) {
    throw new Error('No AI providers configured. Please add at least one API key to .env file.');
  }

  console.log(`📋 Available providers: ${enabledProviders.map(p => p.name).join(', ')}`);

  // Try each provider in order
  for (let i = 0; i < enabledProviders.length; i++) {
    const provider = enabledProviders[i];
    
    try {
      console.log(`🔄 Attempting to generate with ${provider.name}...`);
      const result = await provider.fn(prompt, isPriority);
      
      if (result && result.length > 50) { // Sanity check
        console.log(`✅ Successfully generated with ${provider.name} (${result.length} characters)`);
        return result;
      } else {
        console.log(`⚠️  ${provider.name} returned insufficient content, trying next...`);
      }
    } catch (error) {
      console.log(`❌ ${provider.name} failed: ${error.message}`);
      
      // If this is the last provider, throw the error
      if (i === enabledProviders.length - 1) {
        throw new Error(`All ${enabledProviders.length} AI providers failed. Please check your API keys and try again.`);
      }
      
      // Otherwise, continue to next provider
      console.log(`⏭️  Trying next provider...`);
    }
  }

  // This should never be reached, but just in case
  throw new Error('Failed to generate proposal with any provider');
};

// ===============================
// Generate + parse strict JSON (for the job analyzer / structured features)
// Robustly extracts the first {...} block and parses it. Throws if unparseable.
// ===============================
const generateJSON = async (prompt, isPriority = false) => {
  const raw = await generateProposal(prompt, isPriority);
  // Strip code fences and isolate the JSON object
  let text = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('AI did not return JSON');
  }
  text = text.slice(start, end + 1);
  return JSON.parse(text);
};

module.exports = {
  generateProposal,
  generateJSON,
  generateWithGroq,
  generateWithTogether,
  generateWithOpenRouter,
  generateWithClaude,
  generateWithOpenAI
};