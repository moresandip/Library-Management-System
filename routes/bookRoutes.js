const express = require('express');
const router = express.Router();
const {
  addBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
} = require('../controllers/bookController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  bookRules,
  updateBookRules,
  validateId,
} = require('../validators/validationRules');

// All book routes require authentication
router.use(protect);

router.post('/', authorize('librarian'), bookRules, addBook);
router.get('/', getAllBooks);
router.get('/:id', validateId, getBookById);
router.put('/:id', authorize('librarian'), validateId, updateBookRules, updateBook);
router.delete('/:id', authorize('librarian'), validateId, deleteBook);

router.post('/:id/borrow', authorize('member'), validateId, borrowBook);
router.post('/:id/return', authorize('member'), validateId, returnBook);

module.exports = router;
