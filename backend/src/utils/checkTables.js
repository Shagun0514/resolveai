require('dotenv').config();
const pool = require('../config/database');

pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
  .then(r => { console.log(r.rows); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });