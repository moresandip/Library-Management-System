const Book = require('../models/Book');
const Borrow = require('../models/Borrow');

// @desc    Add a new book (Librarian only)
// @route   POST /api/books
// @access  Private/Librarian
const addBook = async (req, res, next) => {
  const { title, author, isbn, category, quantity } = req.body;

  try {
    // Check duplicate ISBN
    const bookExists = await Book.findOne({ isbn });
    if (bookExists) {
      return res.status(400).json({
        success: false,
        message: 'A book with this ISBN already exists.',
      });
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      category,
      quantity,
      availableQuantity: quantity,
    });

    res.status(201).json({
      success: true,
      message: 'Book added successfully.',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all books (with search, category filter, pagination)
// @route   GET /api/books
// @access  Private (All authenticated users)
const getAllBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const query = {};

    // Filter by category
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Search by title or author
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    const skipIndex = (page - 1) * limit;

    const totalBooks = await Book.countDocuments(query);
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skipIndex);

    const totalPages = Math.ceil(totalBooks / limit);

    res.status(200).json({
      success: true,
      count: books.length,
      totalBooks,
      totalPages,
      currentPage: parseInt(page),
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get book details
// @route   GET /api/books/:id
// @access  Private (All authenticated users)
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book details (Librarian only)
// @route   PUT /api/books/:id
// @access  Private/Librarian
const updateBook = async (req, res, next) => {
  const { title, author, isbn, category, quantity } = req.body;

  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    // Check ISBN uniqueness if updated
    if (isbn && isbn !== book.isbn) {
      const isbnExists = await Book.findOne({ isbn });
      if (isbnExists) {
        return res.status(400).json({
          success: false,
          message: 'Another book with this ISBN already exists.',
        });
      }
      book.isbn = isbn;
    }

    if (title) book.title = title;
    if (author) book.author = author;
    if (category) book.category = category;

    // Handle quantity modification
    if (quantity !== undefined) {
      const borrowedCount = book.quantity - book.availableQuantity;
      if (quantity < borrowedCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce quantity to ${quantity}. There are currently ${borrowedCount} copies borrowed by members.`,
        });
      }
      book.quantity = quantity;
      book.availableQuantity = quantity - borrowedCount;
    }

    const updatedBook = await book.save();

    res.status(200).json({
      success: true,
      message: 'Book updated successfully.',
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book (Librarian only)
// @route   DELETE /api/books/:id
// @access  Private/Librarian
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    // Check if copies are borrowed
    const borrowedCount = book.quantity - book.availableQuantity;
    if (borrowedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book. There are currently ${borrowedCount} copies borrowed by members.`,
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Borrow a book (Member only)
// @route   POST /api/books/:id/borrow
// @access  Private/Member
const borrowBook = async (req, res, next) => {
  const bookId = req.params.id;
  const memberId = req.user._id;

  try {
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    // Check availability
    if (book.availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is currently unavailable.',
      });
    }

    // Check if user has already borrowed this book and hasn't returned it
    const activeBorrow = await Borrow.findOne({
      memberId,
      bookId,
      status: 'borrowed',
    });

    if (activeBorrow) {
      return res.status(400).json({
        success: false,
        message: 'You have already borrowed this book and must return it before borrowing it again.',
      });
    }

    // Atomic update to avoid race conditions
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, availableQuantity: { $gt: 0 } },
      { $inc: { availableQuantity: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(400).json({
        success: false,
        message: 'Book is currently unavailable.',
      });
    }

    // Create borrow record
    await Borrow.create({
      memberId,
      bookId,
      status: 'borrowed',
      borrowDate: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Book borrowed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return a book (Member only)
// @route   POST /api/books/:id/return
// @access  Private/Member
const returnBook = async (req, res, next) => {
  const bookId = req.params.id;
  const memberId = req.user._id;

  try {
    // Find active borrow record
    const borrowRecord = await Borrow.findOne({
      memberId,
      bookId,
      status: 'borrowed',
    });

    if (!borrowRecord) {
      return res.status(400).json({
        success: false,
        message: 'You cannot return a book you have not borrowed or have already returned.',
      });
    }

    // Update borrow record status
    borrowRecord.status = 'returned';
    borrowRecord.returnDate = new Date();
    await borrowRecord.save();

    // Increment available quantity of book
    await Book.findByIdAndUpdate(bookId, {
      $inc: { availableQuantity: 1 },
    });

    res.status(200).json({
      success: true,
      message: 'Book returned successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
};
