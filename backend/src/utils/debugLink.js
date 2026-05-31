require('dotenv').config();
const pool = require('../config/database');

async function debug() {
  const complaints = await pool.query('SELECT ticket_number, customer_email FROM complaints LIMIT 3');
  console.log('Complaints:', complaints.rows);
  
  const customers = await pool.query('SELECT full_name, email FROM customers LIMIT 3');
  console.log('Customers:', customers.rows);
  
  pool.end();
}
debug();