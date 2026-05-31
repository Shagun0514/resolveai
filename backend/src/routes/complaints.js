const router = require('express').Router();
const {
  getComplaints, getComplaint, createComplaint,
  updateComplaint, addMessage, reanalyze
} = require('../controllers/complaintsController');

router.get('/', getComplaints);
router.get('/:id', getComplaint);
router.post('/', createComplaint);
router.patch('/:id', updateComplaint);
router.post('/:id/messages', addMessage);
router.post('/:id/reanalyze', reanalyze);

module.exports = router;
