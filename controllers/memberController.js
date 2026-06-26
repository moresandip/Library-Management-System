const User = require('../models/User');
const Borrow = require('../models/Borrow');

// @desc    Get all registered members (Librarian only)
// @route   GET /api/members
// @access  Private/Librarian
const getAllMembers = async (req, res, next) => {
  try {
    const members = await User.find({ role: 'member' }).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a member (Librarian only)
// @route   DELETE /api/members/:id
// @access  Private/Librarian
const deleteMember = async (req, res, next) => {
  try {
    const memberId = req.params.id;

    // Check if member exists
    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found.',
      });
    }

    // Verify it is a member and not a librarian
    if (member.role !== 'member') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete accounts with librarian role.',
      });
    }

    // Check if member has active borrowed books
    const activeBorrow = await Borrow.findOne({
      memberId,
      status: 'borrowed',
    });

    if (activeBorrow) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete member with active borrowed books. All books must be returned first.',
      });
    }

    // Delete user
    await User.findByIdAndDelete(memberId);

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my borrowed books (Member only)
// @route   GET /api/members/me/books
// @access  Private/Member
const getMyBorrowedBooks = async (req, res, next) => {
  try {
    // Find active borrow records for user and populate book details
    const borrows = await Borrow.find({
      memberId: req.user._id,
      status: 'borrowed',
    }).populate('bookId');

    // Map to clean format containing book details
    const books = borrows.map(item => {
      if (!item.bookId) {
        return {
          borrowId: item._id,
          borrowDate: item.borrowDate,
          status: item.status,
          book: null
        };
      }
      return {
        borrowId: item._id,
        borrowDate: item.borrowDate,
        status: item.status,
        book: {
          id: item.bookId._id,
          title: item.bookId.title,
          author: item.bookId.author,
          isbn: item.bookId.isbn,
          category: item.bookId.category,
        }
      };
    });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  deleteMember,
  getMyBorrowedBooks,
};
