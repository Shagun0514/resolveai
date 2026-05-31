require('dotenv').config();
const pool = require('../config/database');

pool.query(`
  UPDATE complaints c
  SET customer_id = cu.id
  FROM customers cu
  WHERE c.customer_email = cu.email
  AND c.customer_id IS NULL
`).then(r => {
  console.log('✅ Linked', r.rowCount, 'complaints to customers');
  pool.end();
}).catch(e => {
  console.error(e.message);
  pool.end();
});