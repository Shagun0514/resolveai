require('dotenv').config();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── USERS ──────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('password123', 12);
    const adminId = uuidv4();
    const agent1Id = uuidv4();
    const agent2Id = uuidv4();
    const agent3Id = uuidv4();
    const supervisorId = uuidv4();

    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, department) VALUES
      ($1, 'Sarah Chen',      'admin@resolveai.com',      $6, 'admin',      'Operations'),
      ($2, 'Marcus Johnson',  'agent1@resolveai.com',     $6, 'agent',      'Fraud & Disputes'),
      ($3, 'Priya Patel',     'agent2@resolveai.com',     $6, 'agent',      'Loans & Accounts'),
      ($4, 'James Okafor',    'agent3@resolveai.com',     $6, 'agent',      'Digital Banking'),
      ($5, 'David Williams',  'supervisor@resolveai.com', $6, 'supervisor', 'Operations')
      ON CONFLICT (email) DO NOTHING;
    `, [adminId, agent1Id, agent2Id, agent3Id, supervisorId, passwordHash]);

    // ── CUSTOMERS ──────────────────────────────────────────
    const customers = [
      { id: uuidv4(), name: 'Robert Hawkins',     email: 'r.hawkins@email.com',        phone: '+1-555-0142', dob: '1978-04-12', city: 'Chicago',       state: 'IL', zip: '60601', since: '2015-03-01', tier: 'gold',     kyc: true  },
      { id: uuidv4(), name: 'Jennifer Walsh',      email: 'j.walsh@email.com',          phone: '+1-555-0287', dob: '1985-09-23', city: 'Austin',        state: 'TX', zip: '73301', since: '2018-07-15', tier: 'silver',   kyc: true  },
      { id: uuidv4(), name: 'Daniel Torres',       email: 'd.torres@email.com',         phone: '+1-555-0331', dob: '1990-02-14', city: 'Miami',         state: 'FL', zip: '33101', since: '2020-01-10', tier: 'standard', kyc: true  },
      { id: uuidv4(), name: 'Aisha Okafor',        email: 'a.okafor@email.com',         phone: '+1-555-0419', dob: '1993-11-05', city: 'Seattle',       state: 'WA', zip: '98101', since: '2021-05-20', tier: 'standard', kyc: true  },
      { id: uuidv4(), name: 'Michael Chen',        email: 'm.chen@email.com',           phone: '+1-555-0556', dob: '1965-07-30', city: 'San Francisco', state: 'CA', zip: '94101', since: '2010-11-01', tier: 'platinum', kyc: true  },
      { id: uuidv4(), name: 'Global Ventures LLC', email: 'finance@globalventures.com', phone: '+1-555-0671', dob: null,         city: 'New York',      state: 'NY', zip: '10001', since: '2019-02-14', tier: 'platinum', kyc: true  },
      { id: uuidv4(), name: 'Lucy Fernandez',      email: 'l.fernandez@email.com',      phone: '+1-555-0788', dob: '1988-06-18', city: 'Denver',        state: 'CO', zip: '80201', since: '2017-09-03', tier: 'silver',   kyc: true  },
      { id: uuidv4(), name: 'Patricia Moore',      email: 'p.moore@email.com',          phone: '+1-555-0892', dob: '1960-03-25', city: 'Boston',        state: 'MA', zip: '02101', since: '2008-04-22', tier: 'gold',     kyc: true  },
      { id: uuidv4(), name: 'Kevin Zhang',         email: 'k.zhang@email.com',          phone: '+1-555-0934', dob: '1982-12-09', city: 'Los Angeles',   state: 'CA', zip: '90001', since: '2016-08-17', tier: 'gold',     kyc: true  },
      { id: uuidv4(), name: 'Maria Gonzalez',      email: 'm.gonzalez@email.com',       phone: '+1-555-1023', dob: '1975-05-14', city: 'Houston',       state: 'TX', zip: '77001', since: '2013-12-05', tier: 'silver',   kyc: true  },
      { id: uuidv4(), name: 'Thomas Bradley',      email: 't.bradley@email.com',        phone: '+1-555-1145', dob: '1955-08-22', city: 'Phoenix',       state: 'AZ', zip: '85001', since: '2005-06-30', tier: 'platinum', kyc: true  },
      { id: uuidv4(), name: 'Samantha Lee',        email: 's.lee@email.com',            phone: '+1-555-1267', dob: '1995-01-17', city: 'Portland',      state: 'OR', zip: '97201', since: '2022-03-11', tier: 'standard', kyc: false },
      { id: uuidv4(), name: 'Ahmed Hassan',        email: 'a.hassan@email.com',         phone: '+1-555-1389', dob: '1987-10-03', city: 'Detroit',       state: 'MI', zip: '48201', since: '2019-07-28', tier: 'standard', kyc: true  },
    ];

    for (const c of customers) {
      await client.query(`
        INSERT INTO customers (id, full_name, email, phone, date_of_birth, city, state, zip_code, customer_since, customer_tier, kyc_verified)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (email) DO NOTHING;
      `, [c.id, c.name, c.email, c.phone, c.dob, c.city, c.state, c.zip, c.since, c.tier, c.kyc]);
    }

    // ── ACCOUNTS ───────────────────────────────────────────
    const accountRows = [
      [customers[0].id, 'ACC-CHK-44521001', 'checking', '****4521', 12480.55,  'active'],
      [customers[0].id, 'ACC-SAV-44521002', 'savings',  '****1002', 34200.00,  'active'],
      [customers[1].id, 'ACC-MTG-78920011', 'mortgage', '****0011', 284000.00, 'active'],
      [customers[2].id, 'ACC-CRD-55210022', 'credit',   '****0022', -2340.00,  'active'],
      [customers[3].id, 'ACC-CHK-22330033', 'checking', '****0033', 3820.10,   'active'],
      [customers[4].id, 'ACC-SAV-88440044', 'savings',  '****0044', 92000.00,  'active'],
      [customers[5].id, 'BIZ-ACC-77821001', 'business', '****1001', 458000.00, 'frozen'],
      [customers[6].id, 'ACC-CHK-33670055', 'checking', '****0055', 1240.88,   'active'],
      [customers[7].id, 'ACC-SAV-55440066', 'savings',  '****0066', 47800.00,  'active'],
      [customers[8].id, 'ACC-INV-99010077', 'checking', '****0077', 218500.00, 'active'],
      [customers[9].id, 'ACC-CHK-10230088', 'checking', '****0088', 5670.20,   'active'],
      [customers[10].id,'ACC-RET-11450099', 'savings',  '****0099', 312000.00, 'active'],
      [customers[11].id,'ACC-CHK-12670100', 'checking', '****0100', 890.45,    'active'],
      [customers[12].id,'ACC-CHK-13890101', 'checking', '****0101', 7230.60,   'active'],
    ];

    for (const [cid, accNum, type, masked, bal, status] of accountRows) {
      await client.query(`
        INSERT INTO accounts (customer_id, account_number, account_type, masked_number, balance, status, opened_date)
        VALUES ($1,$2,$3,$4,$5,$6, NOW() - INTERVAL '3 years')
        ON CONFLICT (account_number) DO NOTHING;
      `, [cid, accNum, type, masked, bal, status]);
    }

    // ── COMPLAINTS ─────────────────────────────────────────
    const hoursAgo = (h) => new Date(Date.now() - h * 3600000);
    const hoursFromNow = (h) => new Date(Date.now() + h * 3600000);

    const complaints = [
      {
        id: uuidv4(), ticket: 'TKT-2024-001', channel: 'email', status: 'open', priority: 'critical',
        subject: 'Unauthorized transaction of $5,200 on my account',
        description: 'I noticed an unauthorized debit of $5,200.00 from my checking account (****4521) on November 15th at 3:42 AM. I was asleep and did not authorize this transaction. The merchant shows as "INTL TRANSFER REF#887621". I need this reversed immediately and my account secured. This is causing me extreme financial stress.',
        cIdx: 0, category: 'Fraud & Disputes', sentiment: 'very_negative', score: 0.05,
        summary: 'Customer reports unauthorized $5,200 international transfer at 3:42 AM. Claims no authorization given. Requests immediate reversal and account security review.',
        entities: { transaction_id: 'REF#887621', amount: '$5,200.00', date: '2024-11-15', account: '****4521' },
        assigned: agent1Id, createdHoursAgo: 14, slaHours: 4,
        agentReply: 'Dear Mr. Hawkins, we have received your fraud report and immediately flagged your account for security review. Our fraud team is actively investigating transaction REF#887621. We have placed a temporary hold on further transactions to protect your account. You will receive an update within 2 hours. Reference case: FRAUD-2024-887621.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-002', channel: 'chat', status: 'in_progress', priority: 'high',
        subject: 'Mortgage refinancing application stuck for 3 weeks',
        description: 'My mortgage refinancing application (#MRF-89234) has been pending for 3 weeks with no updates. I was told it would take 5-7 business days. The rate I locked in expires in 10 days and I\'m worried I\'ll lose it. Nobody at the branch can tell me what\'s happening.',
        cIdx: 1, category: 'Loans & Mortgages', sentiment: 'negative', score: 0.22,
        summary: 'Mortgage refi app #MRF-89234 delayed beyond estimate, now 3 weeks pending. Rate lock expires in 10 days. Customer frustrated by lack of communication.',
        entities: { application_id: 'MRF-89234', issue: 'rate lock expiry in 10 days' },
        assigned: agent2Id, createdHoursAgo: 2, slaHours: 8,
        agentReply: 'Dear Ms. Walsh, I sincerely apologize for the delay. I have escalated application #MRF-89234 to our mortgage processing team directly. I can confirm your rate lock is being extended at no cost given the delay was on our end. You will receive a status call within 4 business hours.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-003', channel: 'web', status: 'open', priority: 'high',
        subject: 'Credit score dropped 87 points due to bank error',
        description: 'My credit score dropped from 742 to 655 because your bank incorrectly reported a missed payment on my credit card (Acct #CC-445521). I have proof of payment with transaction ID TXN-445521-NOV. This is seriously affecting my ability to get a car loan. Please correct this with all credit bureaus immediately.',
        cIdx: 2, category: 'Credit & Reporting', sentiment: 'very_negative', score: 0.08,
        summary: 'Erroneous missed payment report caused 87-point credit score drop (742→655). Customer has transaction proof TXN-445521-NOV. Requesting immediate bureau correction.',
        entities: { transaction_id: 'TXN-445521-NOV', account: 'CC-445521', credit_drop: '87 points' },
        assigned: null, createdHoursAgo: 48, slaHours: 8,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-004', channel: 'email', status: 'in_progress', priority: 'medium',
        subject: 'Mobile app login broken after update v4.2.1',
        description: 'After updating to version 4.2.1 of your banking app, I cannot log in. The app crashes after entering my PIN. I\'ve tried reinstalling twice on my iPhone 15 Pro (iOS 17.2). I\'ve been unable to access my accounts for 4 days. I need access to pay my rent which is due tomorrow.',
        cIdx: 3, category: 'Digital Banking', sentiment: 'negative', score: 0.28,
        summary: 'App v4.2.1 crashes on PIN entry for iPhone 15 Pro/iOS 17.2. 4 days without account access. Rent payment urgency.',
        entities: { app_version: '4.2.1', device: 'iPhone 15 Pro', os: 'iOS 17.2' },
        assigned: agent3Id, createdHoursAgo: 24, slaHours: 24,
        agentReply: 'Dear Ms. Okafor, we are aware of an issue affecting iOS 17.2 users after the v4.2.1 update. Our engineering team has deployed a hotfix (v4.2.2). Please update your app and try again. If the issue persists, we can enable browser-based access as a temporary solution.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-005', channel: 'api', status: 'resolved', priority: 'low',
        subject: 'Request to update beneficiary information',
        description: 'I would like to update the beneficiary on my savings account to my daughter, Emily Chen (DOB: 1995-03-22). The current beneficiary is my ex-spouse and I need this changed following our divorce. Please advise on required documents.',
        cIdx: 4, category: 'Account Management', sentiment: 'neutral', score: 0.55,
        summary: 'Routine beneficiary change request post-divorce. Customer needs documentation guidance.',
        entities: { beneficiary: 'Emily Chen', account_type: 'savings' },
        assigned: agent2Id, createdHoursAgo: 9, slaHours: 72,
        agentReply: 'Dear Mr. Chen, to update your beneficiary we require: (1) Completed Beneficiary Change Form, (2) Copy of divorce decree, (3) Government-issued ID. You can submit these at any branch or via secure upload in the app. Processing takes 2-3 business days.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-006', channel: 'chat', status: 'escalated', priority: 'critical',
        subject: 'Business account completely frozen - payroll at risk',
        description: 'Our business account (BIZ-ACC-77821) was frozen without any notice at 9 AM today. We have payroll running tomorrow for 47 employees totaling $218,000. We have received no communication about why the account was frozen. This is an emergency - people\'s livelihoods depend on this being resolved TODAY.',
        cIdx: 5, category: 'Business Banking', sentiment: 'very_negative', score: 0.02,
        summary: 'Business account frozen without notice. Payroll of $218K for 47 employees at risk. CRITICAL escalation needed.',
        entities: { account: 'BIZ-ACC-77821', payroll_amount: '$218,000', employees: '47' },
        assigned: supervisorId, createdHoursAgo: 5, slaHours: 2,
        agentReply: 'This complaint has been escalated to the Business Banking Emergency Response Team and Supervisor David Williams. A senior relationship manager will call you within 30 minutes. Case ID: BIZ-ESCL-2024-77821.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-007', channel: 'email', status: 'pending', priority: 'medium',
        subject: 'ATM swallowed my card during withdrawal',
        description: 'The ATM at 445 Oak Street branch (ATM ID: ATM-OAK-003) swallowed my debit card this morning at 8:15 AM during a $200 withdrawal. The transaction did not complete but the card was retained. I need a replacement card urgently.',
        cIdx: 6, category: 'ATM & Cards', sentiment: 'negative', score: 0.31,
        summary: 'ATM-OAK-003 retained debit card during incomplete $200 withdrawal. Card replacement and transaction reversal needed.',
        entities: { atm_id: 'ATM-OAK-003', amount: '$200', time: '8:15 AM', location: '445 Oak Street' },
        assigned: agent1Id, createdHoursAgo: 36, slaHours: 24,
        agentReply: 'Dear Ms. Fernandez, we have confirmed your card was retained by ATM-OAK-003. The $200 was NOT debited from your account. A replacement card has been ordered (expedited, 1-2 business days). We have also filed an ATM incident report.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-008', channel: 'web', status: 'open', priority: 'low',
        subject: 'Excellent service from branch manager James Hartley',
        description: 'I wanted to commend branch manager James Hartley at the Downtown branch. He went above and beyond helping me consolidate my loans and explained all options clearly. This is the kind of service that builds customer loyalty.',
        cIdx: 7, category: 'Feedback & Compliments', sentiment: 'positive', score: 0.96,
        summary: 'Customer commends branch manager James Hartley for exceptional loan consolidation service.',
        entities: { employee: 'James Hartley', branch: 'Downtown', service: 'loan consolidation' },
        assigned: null, createdHoursAgo: 3, slaHours: 72,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-009', channel: 'phone', status: 'open', priority: 'high',
        subject: 'Double charged for same transaction - $1,840',
        description: 'I was charged twice for a payment to Home Depot on November 18th. Both charges of $920.00 appear on my account (TXN-HC-001 and TXN-HC-002). Total overcharge is $1,840. Please reverse one immediately.',
        cIdx: 8, category: 'Transaction Issues', sentiment: 'negative', score: 0.21,
        summary: 'Duplicate charge of $920 at Home Depot. Two transactions TXN-HC-001 and TXN-HC-002 both processed. Requesting reversal of duplicate.',
        entities: { transaction_id: 'TXN-HC-001, TXN-HC-002', amount: '$920.00 x2', merchant: 'Home Depot' },
        assigned: agent1Id, createdHoursAgo: 6, slaHours: 8,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-010', channel: 'email', status: 'in_progress', priority: 'medium',
        subject: 'Unable to set up international wire transfer online',
        description: 'I need to send $15,000 to my family in Mexico (account: CLABE 123456789012345678, Banco Nacional). The online portal keeps showing error code ERR-INTL-403 when I try to submit. I have all required documents. This transfer is time-sensitive for a property purchase.',
        cIdx: 9, category: 'Transaction Issues', sentiment: 'negative', score: 0.35,
        summary: 'International wire transfer of $15K blocked by portal error ERR-INTL-403. Time-sensitive for property purchase in Mexico.',
        entities: { amount: '$15,000', error_code: 'ERR-INTL-403', destination: 'Mexico', bank: 'Banco Nacional' },
        assigned: agent2Id, createdHoursAgo: 12, slaHours: 24,
        agentReply: 'Dear Ms. Gonzalez, error ERR-INTL-403 typically indicates a daily limit flag. We have temporarily raised your international transfer limit. Please retry in the portal - if it fails again, call 1-800-RESOLVE and reference case TKT-2024-010 for priority handling.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-011', channel: 'chat', status: 'open', priority: 'critical',
        subject: 'Retirement account shows $0 balance - all investments gone',
        description: 'I logged in this morning and my retirement account (****0099) shows a $0 balance. Yesterday it showed $312,000. I have not made any withdrawals or changes. I am 68 years old and this is my entire retirement savings. I am having a panic attack. Please help me immediately.',
        cIdx: 10, category: 'Investments', sentiment: 'very_negative', score: 0.01,
        summary: 'Retirement account showing $0 balance after displaying $312K previous day. No withdrawals made. Elderly customer in distress. IMMEDIATE investigation required.',
        entities: { account: '****0099', amount: '$312,000', account_type: 'retirement' },
        assigned: supervisorId, createdHoursAgo: 1, slaHours: 4,
        agentReply: 'Mr. Bradley, I understand your extreme concern. I am escalating this to our highest priority queue immediately. Your account is being reviewed by our investment operations team right now. This appears to be a display error - your funds are safe. A senior advisor will call you back within 15 minutes.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-012', channel: 'web', status: 'open', priority: 'medium',
        subject: 'Loan prepayment penalty not disclosed at signing',
        description: 'I am being charged a $3,200 prepayment penalty on my auto loan that was never disclosed to me at signing. I have reviewed my loan documents and there is no mention of prepayment penalties. This feels like a deceptive practice. I want this waived and the loan paid off.',
        cIdx: 11, category: 'Loans & Mortgages', sentiment: 'negative', score: 0.18,
        summary: 'Undisclosed $3,200 prepayment penalty on auto loan. Customer claims no mention in signed documents. Requesting waiver and compliance review.',
        entities: { amount: '$3,200', loan_type: 'auto loan', issue: 'undisclosed prepayment penalty' },
        assigned: agent2Id, createdHoursAgo: 20, slaHours: 24,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-013', channel: 'email', status: 'resolved', priority: 'low',
        subject: 'Request for 12-month account statement for visa application',
        description: 'I need a certified 12-month bank statement for my savings account for a US visa application. The statement needs an official bank stamp and signature. My visa appointment is in 5 days.',
        cIdx: 4, category: 'Account Management', sentiment: 'neutral', score: 0.60,
        summary: 'Official 12-month certified statement needed for visa application within 5 days.',
        entities: { account_type: 'savings', purpose: 'visa application', urgency: '5 days' },
        assigned: agent3Id, createdHoursAgo: 72, slaHours: 72,
        agentReply: 'Dear Mr. Chen, your certified 12-month statement has been prepared. You can collect it at any branch with your photo ID, or we can courier it to your registered address (2-day delivery). The statement is valid for 30 days from today.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-014', channel: 'phone', status: 'in_progress', priority: 'high',
        subject: 'Phishing attempt - someone called pretending to be the bank',
        description: 'I received a call from someone claiming to be from your bank\'s fraud department. They knew my account number and asked me to verify my SSN and OTP. I gave them the OTP before realizing it was suspicious. I have not seen any unauthorized transactions yet but I am very worried. My account number is ****0101.',
        cIdx: 12, category: 'Fraud & Disputes', sentiment: 'very_negative', score: 0.10,
        summary: 'Customer fell victim to vishing attack. OTP was compromised. No unauthorized transactions yet but account at risk. Immediate security lockdown needed.',
        entities: { account: '****0101', threat_type: 'vishing/OTP compromise', status: 'OTP compromised' },
        assigned: agent1Id, createdHoursAgo: 3, slaHours: 4,
        agentReply: 'Dear Mr. Hassan, we have immediately invalidated all existing OTPs and placed a security hold on your account. We are generating new credentials for you. NO legitimate bank representative will ever ask for your OTP. Our security team will contact you within 1 hour to verify your identity and restore full access.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-015', channel: 'web', status: 'open', priority: 'medium',
        subject: 'Wrong name on newly issued credit card',
        description: 'My replacement credit card arrived with my name spelled incorrectly: "SAMATHA LEE" instead of "SAMANTHA LEE". Several merchants have already declined the card due to name mismatch with my ID. I need a corrected card urgently.',
        cIdx: 11, category: 'ATM & Cards', sentiment: 'negative', score: 0.33,
        summary: 'Credit card issued with misspelled name (SAMATHA vs SAMANTHA). Causing merchant declines. Replacement needed.',
        entities: { issue: 'name misspelling', card_type: 'credit card' },
        assigned: agent3Id, createdHoursAgo: 8, slaHours: 24,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-016', channel: 'email', status: 'open', priority: 'low',
        subject: 'Interest rate on savings account lower than advertised',
        description: 'Your website advertises 4.75% APY on the Premier Savings account. My account statement shows only 3.25% APY. I opened this account specifically because of the advertised rate 2 months ago. I want the difference backdated and the correct rate applied going forward.',
        cIdx: 7, category: 'Account Management', sentiment: 'negative', score: 0.30,
        summary: 'Savings account paying 3.25% APY vs advertised 4.75%. Customer opened account based on higher rate. Requesting backdated correction.',
        entities: { advertised_rate: '4.75% APY', applied_rate: '3.25% APY', account_type: 'Premier Savings' },
        assigned: null, createdHoursAgo: 16, slaHours: 72,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-017', channel: 'chat', status: 'resolved', priority: 'medium',
        subject: 'Online banking password reset not working',
        description: 'I have been locked out of my online banking for 2 days. The password reset email is not arriving (checked spam). I have tried 3 times. I need access to check my account balance and pay bills.',
        cIdx: 3, category: 'Digital Banking', sentiment: 'negative', score: 0.28,
        summary: 'Password reset emails not delivered. Customer locked out for 2 days. Bill payment urgency.',
        entities: { issue: 'password reset email not delivered', duration: '2 days' },
        assigned: agent3Id, createdHoursAgo: 96, slaHours: 24,
        agentReply: 'Dear Ms. Okafor, I manually triggered a password reset to your alternate email on file. Additionally, I have reset your account lockout. You should receive the email within 5 minutes. Going forward, you can also reset via our app using biometric verification.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-018', channel: 'api', status: 'open', priority: 'high',
        subject: 'Business loan application rejected without explanation',
        description: 'Our business loan application (BIZ-LOAN-2024-4421) for $500,000 was rejected after 6 weeks of review with no explanation given. We have excellent credit (business score 780), 5 years of profitable operation, and provided all requested documents. We need detailed reasons and a review.',
        cIdx: 5, category: 'Business Banking', sentiment: 'negative', score: 0.20,
        summary: 'Business loan application BIZ-LOAN-2024-4421 for $500K rejected after 6 weeks with no reason given. Strong credentials (780 score, 5yr profitable). Requesting detailed explanation.',
        entities: { application_id: 'BIZ-LOAN-2024-4421', amount: '$500,000', credit_score: '780' },
        assigned: supervisorId, createdHoursAgo: 10, slaHours: 8,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-019', channel: 'email', status: 'pending', priority: 'medium',
        subject: 'Foreign transaction fees charged on domestic purchase',
        description: 'I was charged $47.50 in foreign transaction fees on a purchase I made at a store in California. The merchant is a US-based company. My card should not be charging foreign transaction fees on domestic purchases. I have a premium account that is supposed to waive all such fees.',
        cIdx: 8, category: 'ATM & Cards', sentiment: 'negative', score: 0.32,
        summary: 'Foreign transaction fees incorrectly charged on domestic purchase. Premium account should waive these fees. $47.50 refund requested.',
        entities: { amount: '$47.50', fee_type: 'foreign transaction fee', account_type: 'premium' },
        assigned: agent1Id, createdHoursAgo: 30, slaHours: 24,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-020', channel: 'web', status: 'open', priority: 'low',
        subject: 'Feedback on new mobile app design - very positive',
        description: 'Just wanted to say the new app redesign is fantastic. The dark mode works perfectly, the biometric login is seamless, and I love the spending analytics feature. This is a huge improvement over the old app. Your tech team deserves recognition.',
        cIdx: 9, category: 'Feedback & Compliments', sentiment: 'positive', score: 0.98,
        summary: 'Positive feedback on new mobile app redesign. Customer praises dark mode, biometric login, and spending analytics.',
        entities: { feature: 'mobile app v4.2', aspects: 'dark mode, biometrics, analytics' },
        assigned: null, createdHoursAgo: 4, slaHours: 72,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-021', channel: 'phone', status: 'escalated', priority: 'critical',
        subject: 'Identity theft - multiple accounts opened in my name',
        description: 'I received credit alerts showing 3 new accounts opened in my name at your bank that I did not authorize. Someone has stolen my identity. Account numbers ending in 8821, 8822, and 8823 were opened last week. I need these closed immediately and a fraud investigation opened.',
        cIdx: 0, category: 'Fraud & Disputes', sentiment: 'very_negative', score: 0.03,
        summary: 'Identity theft - 3 fraudulent accounts opened without authorization. Accounts ****8821, ****8822, ****8823. Immediate closure and full investigation required.',
        entities: { fraudulent_accounts: '****8821, ****8822, ****8823', crime: 'identity theft' },
        assigned: supervisorId, createdHoursAgo: 2, slaHours: 2,
        agentReply: 'ESCALATED TO FRAUD INVESTIGATIONS UNIT. All three unauthorized accounts have been frozen pending investigation. A dedicated fraud analyst will contact you within 1 hour. Case number: ID-THEFT-2024-RH001. You will receive written confirmation within 24 hours.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-022', channel: 'chat', status: 'in_progress', priority: 'medium',
        subject: 'Cheque deposit not credited after 7 business days',
        description: 'I deposited a $4,500 cheque on November 10th at the Westside branch. It has been 7 business days and the funds are still not in my account. The teller said it would take 3-5 business days. I have the deposit slip reference DEP-WS-20241110-0042.',
        cIdx: 6, category: 'Transaction Issues', sentiment: 'negative', score: 0.26,
        summary: 'Cheque deposit of $4,500 not credited after 7 business days. Reference DEP-WS-20241110-0042. Expected clearance was 3-5 days.',
        entities: { amount: '$4,500', reference: 'DEP-WS-20241110-0042', deposit_date: '2024-11-10' },
        assigned: agent2Id, createdHoursAgo: 18, slaHours: 24,
        agentReply: 'Dear Ms. Fernandez, I have located your deposit DEP-WS-20241110-0042. It was flagged for manual review due to the amount. I have approved the release of funds and they should appear in your account within 2 hours.',
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-023', channel: 'email', status: 'open', priority: 'high',
        subject: 'Home equity loan payment not applied correctly',
        description: 'My last three payments on my home equity loan (HEL-2021-9923) have been applied entirely to interest with nothing going to principal, despite being on a standard amortization schedule. I have paid $4,200 in the last 3 months with $0 principal reduction. Something is wrong with your system.',
        cIdx: 1, category: 'Loans & Mortgages', sentiment: 'negative', score: 0.19,
        summary: 'HEL-2021-9923 payments of $4,200 over 3 months applied entirely to interest. No principal reduction. Amortization schedule not being followed.',
        entities: { loan_id: 'HEL-2021-9923', amount: '$4,200', issue: 'payment misapplication' },
        assigned: agent2Id, createdHoursAgo: 22, slaHours: 8,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-024', channel: 'web', status: 'open', priority: 'medium',
        subject: 'Dispute: merchant charged after cancellation',
        description: 'I cancelled my subscription with TechPro Software on October 31st (cancellation confirmation #TECH-CANCEL-7721). Despite this, they charged my card $299 on November 1st and again on November 15th. Total unauthorized charges: $598. Please dispute both transactions.',
        cIdx: 2, category: 'Fraud & Disputes', sentiment: 'negative', score: 0.25,
        summary: 'Two charges of $299 from TechPro Software after confirmed cancellation. Total $598 to dispute. Cancellation ref TECH-CANCEL-7721.',
        entities: { merchant: 'TechPro Software', amount: '$299 x2 = $598', cancellation_ref: 'TECH-CANCEL-7721' },
        assigned: agent1Id, createdHoursAgo: 26, slaHours: 24,
        agentReply: null,
      },
      {
        id: uuidv4(), ticket: 'TKT-2024-025', channel: 'phone', status: 'resolved', priority: 'low',
        subject: 'Request to remove deceased spouse from joint account',
        description: 'My husband passed away on October 22nd, 2024. I need to remove him from our joint checking account (****4521) and update it to a sole account in my name. I have the death certificate and probate documents ready.',
        cIdx: 7, category: 'Account Management', sentiment: 'neutral', score: 0.48,
        summary: 'Deceased spouse removal from joint account. Death certificate and probate documents available. Routine account restructuring.',
        entities: { account: '****4521', account_type: 'joint checking', documents: 'death certificate, probate' },
        assigned: agent2Id, createdHoursAgo: 120, slaHours: 72,
        agentReply: 'Dear Ms. Moore, we extend our deepest condolences for your loss. We have scheduled a private appointment at your nearest branch for the account restructuring. All required forms have been prepared. This process will be handled with the utmost sensitivity and privacy.',
      },
    ];

    for (const c of complaints) {
      const customer = customers[c.cIdx];
      const createdAt = hoursAgo(c.createdHoursAgo);
      const slaAt = new Date(createdAt.getTime() + c.slaHours * 3600000);
      const isOverdue = slaAt < new Date() && !['resolved', 'closed'].includes(c.status);

      await client.query(`
        INSERT INTO complaints (
          id, ticket_number, channel, status, priority, subject, description,
          customer_id, customer_name, customer_email, customer_phone, customer_account_number,
          ai_category, ai_sentiment, ai_sentiment_score, ai_summary, ai_entities,
          ai_processed_at, assigned_to, assigned_at, sla_due_at, sla_breached,
          resolved_at, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
          $13,$14,$15,$16,$17,
          $18,$19,$20,$21,$22,
          $23,$24,$24
        ) ON CONFLICT (ticket_number) DO NOTHING;
      `, [
        c.id, c.ticket, c.channel, c.status, c.priority, c.subject, c.description,
        customer.id, customer.name, customer.email, customer.phone,
        accountRows[c.cIdx] ? accountRows[c.cIdx][3] : null,
        c.category, c.sentiment, c.score, c.summary, JSON.stringify(c.entities),
        createdAt,
        c.assigned, c.assigned ? createdAt : null,
        slaAt, isOverdue,
        c.status === 'resolved' ? hoursAgo(c.createdHoursAgo - 2) : null,
        createdAt,
      ]);

      // Customer message
      await client.query(`
        INSERT INTO messages (complaint_id, sender_type, sender_name, content, created_at)
        VALUES ($1, 'customer', $2, $3, $4);
      `, [c.id, customer.name, c.description, createdAt]);

      // System acknowledgement
      await client.query(`
        INSERT INTO messages (complaint_id, sender_type, sender_name, content, created_at)
        VALUES ($1, 'system', 'System', $2, $3);
      `, [c.id, `Complaint received and assigned ticket ${c.ticket}. AI analysis completed.`, new Date(createdAt.getTime() + 60000)]);

      // Agent reply if exists
      if (c.agentReply && c.assigned) {
        await client.query(`
          INSERT INTO messages (complaint_id, sender_type, sender_id, sender_name, content, created_at)
          VALUES ($1, 'agent', $2, 'Agent', $3, $4);
        `, [c.id, c.assigned, c.agentReply, new Date(createdAt.getTime() + 3600000)]);
      }

      // Update customer complaint count
      await client.query(`
        UPDATE customers SET total_complaints = total_complaints + 1 WHERE id = $1
      `, [customer.id]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed data inserted successfully');
    console.log('   25 complaints, 13 customers, 14 accounts, 4 users');
    console.log('👤 Test accounts:');
    console.log('   Admin:      admin@resolveai.com / password123');
    console.log('   Agent:      agent1@resolveai.com / password123');
    console.log('   Supervisor: supervisor@resolveai.com / password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

seed().catch(console.error);
