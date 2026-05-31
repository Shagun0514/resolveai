const OpenAI = require('openai');

let openai;
const getClient = () => {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

const CATEGORIES = [
  'Fraud & Disputes', 'Transaction Issues', 'Loans & Mortgages',
  'Credit & Reporting', 'Digital Banking', 'ATM & Cards',
  'Account Management', 'Business Banking', 'Investments',
  'Customer Service', 'Feedback & Compliments', 'Other'
];

async function analyzeComplaint(subject, description, customerName) {
  // Mock AI response if no API key configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
    return getMockAnalysis(subject, description);
  }

  try {
    const client = getClient();
    const prompt = `Analyze this banking customer complaint and return a JSON object.

Customer: ${customerName}
Subject: ${subject}
Description: ${description}

Return ONLY valid JSON with this exact structure:
{
  "category": "one of: ${CATEGORIES.join(', ')}",
  "sentiment": "one of: positive, neutral, negative, very_negative",
  "sentiment_score": 0.0 to 1.0 (1.0 = very positive),
  "summary": "2-3 sentence summary of the issue",
  "suggested_response": "professional draft response (150-200 words) addressing the complaint",
  "entities": {
    "transaction_id": "if mentioned",
    "amount": "if mentioned",
    "date": "if mentioned",
    "account": "if mentioned",
    "other_key_info": "any other important entity"
  },
  "priority_suggestion": "low|medium|high|critical",
  "is_duplicate_risk": true or false,
  "tags": ["array", "of", "relevant", "tags"]
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error('AI analysis error:', err.message);
    return getMockAnalysis(subject, description);
  }
}

function getMockAnalysis(subject, description) {
  const text = (subject + ' ' + description).toLowerCase();

  let category = 'Other';
  if (text.includes('fraud') || text.includes('unauthorized') || text.includes('scam')) category = 'Fraud & Disputes';
  else if (text.includes('mortgage') || text.includes('loan')) category = 'Loans & Mortgages';
  else if (text.includes('credit score') || text.includes('credit report')) category = 'Credit & Reporting';
  else if (text.includes('app') || text.includes('mobile') || text.includes('online')) category = 'Digital Banking';
  else if (text.includes('atm') || text.includes('card')) category = 'ATM & Cards';
  else if (text.includes('account')) category = 'Account Management';
  else if (text.includes('business') || text.includes('payroll')) category = 'Business Banking';
  else if (text.includes('thank') || text.includes('excellent') || text.includes('great')) category = 'Feedback & Compliments';
  else if (text.includes('transaction') || text.includes('payment') || text.includes('transfer')) category = 'Transaction Issues';

  const negativeWords = ['unauthorized', 'fraud', 'stolen', 'error', 'wrong', 'broken', 'frozen', 'urgent', 'immediately', 'emergency'];
  const positiveWords = ['thank', 'excellent', 'great', 'wonderful', 'appreciate', 'commend'];
  const negCount = negativeWords.filter(w => text.includes(w)).length;
  const posCount = positiveWords.filter(w => text.includes(w)).length;

  let sentiment = 'neutral';
  let score = 0.5;
  if (posCount > 0) { sentiment = 'positive'; score = 0.85; }
  else if (negCount >= 3) { sentiment = 'very_negative'; score = 0.08; }
  else if (negCount >= 1) { sentiment = 'negative'; score = 0.28; }

  return {
    category,
    sentiment,
    sentiment_score: score,
    summary: `Customer ${subject.toLowerCase()}. ${description.substring(0, 150)}...`,
    suggested_response: `Dear Customer,\n\nThank you for bringing this matter to our attention. We sincerely apologize for the inconvenience you have experienced.\n\nWe have received your complaint regarding "${subject}" and have escalated it to our specialized team for immediate review. We understand the urgency of this situation and want to assure you that we are treating this with the highest priority.\n\nOur team will investigate this matter thoroughly and provide you with a resolution within our committed SLA timeframe. We will keep you updated on the progress via email.\n\nThank you for your patience and for being a valued customer.\n\nBest regards,\nResolveAI Customer Support Team`,
    entities: extractEntitiesSimple(description),
    priority_suggestion: negCount >= 3 ? 'high' : negCount >= 1 ? 'medium' : 'low',
    is_duplicate_risk: false,
    tags: [category.toLowerCase().replace(/ /g, '-'), sentiment]
  };
}

function extractEntitiesSimple(text) {
  const entities = {};
  const txnMatch = text.match(/\b(TXN|REF|ID)[#\-]?[\w\d]+/i);
  if (txnMatch) entities.transaction_id = txnMatch[0];
  const amountMatch = text.match(/\$[\d,]+(\.\d{2})?/);
  if (amountMatch) entities.amount = amountMatch[0];
  const dateMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i);
  if (dateMatch) entities.date = dateMatch[0];
  const acctMatch = text.match(/\*{2,4}\d{4}|ACC[-\d]+|BIZ-ACC[-\d]+/i);
  if (acctMatch) entities.account = acctMatch[0];
  return entities;
}

module.exports = { analyzeComplaint };
