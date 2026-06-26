require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedLibrarian = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/library');
    console.log('Connected to MongoDB for seeding...');

    const librarianEmail = 'librarian@library.com';

    // Check if librarian already exists
    const existingLibrarian = await User.findOne({ email: librarianEmail });

    if (existingLibrarian) {
      console.log('Librarian account already exists:');
      console.log(`Email: ${existingLibrarian.email}`);
      console.log(`Role: ${existingLibrarian.role}`);
    } else {
      // Create default librarian
      const librarian = await User.create({
        name: 'Admin Librarian',
        email: librarianEmail,
        password: 'librarian123',
        role: 'librarian',
      });

      console.log('Successfully seeded default Librarian account!');
      console.log(`Email: ${librarian.email}`);
      console.log(`Password: librarian123`);
      console.log(`Role: ${librarian.role}`);
    }

    mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedLibrarian();
