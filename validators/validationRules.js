const { body, param, validationResult } = require('express-validator');

// Validation runner middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMsg,
    });
  }
  next();
};

// Check if parameter is a valid Mongo ObjectID
const validateId = [
  param('id').isMongoId().withMessage('Invalid ID format.'),
  validate
];

const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.'),
  body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please provide a valid email address.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('role')
    .optional()
    .isIn(['member'])
    .withMessage('Users can only register as Member.'),
  validate
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
  validate
];

const bookRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.'),
  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required.'),
  body('isbn')
    .trim()
    .notEmpty()
    .withMessage('ISBN is required.'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required.'),
  body('quantity')
    .exists()
    .withMessage('Quantity is required.')
    .isInt({ min: 0 })
    .withMessage('Quantity cannot be negative.'),
  validate
];

const updateBookRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty.'),
  body('author')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Author cannot be empty.'),
  body('isbn')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('ISBN cannot be empty.'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty.'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity cannot be negative.'),
  validate
];

module.exports = {
  registerRules,
  loginRules,
  bookRules,
  updateBookRules,
  validateId,
};
