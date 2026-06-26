const express = require('express');
const router = express.Router();
const {
  getAllMembers,
  deleteMember,
  getMyBorrowedBooks,
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateId } = require('../validators/validationRules');

// All member routes require authentication
router.use(protect);

router.get('/', authorize('librarian'), getAllMembers);
router.get('/me/books', authorize('member'), getMyBorrowedBooks);
router.delete('/:id', authorize('librarian'), validateId, deleteMember);

module.exports = router;
