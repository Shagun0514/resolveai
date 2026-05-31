const router = require('express').Router();
const pool = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY name');
    res.json({ users: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
