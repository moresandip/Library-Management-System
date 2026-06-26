const BASE_URL = 'http://localhost:5000/api';
const randomEmail = `member_${Date.now()}@librarytest.com`;

const runTests = async () => {
  console.log('🚀 Starting Library Management System API Verification Tests...\n');

  let librarianToken = '';
  let memberToken = '';
  let testBookId = '';
  let testMemberId = '';

  try {
    // ----------------------------------------------------
    // TEST 1: Login as Librarian (Seeded Account)
    // ----------------------------------------------------
    console.log('⏳ Test 1: Logging in as seeded Librarian...');
    const libLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'librarian@library.com',
        password: 'librarian123'
      })
    });
    const libLoginData = await libLoginRes.json();
    if (libLoginRes.status === 200 && libLoginData.success) {
      librarianToken = libLoginData.token;
      console.log('✅ Librarian login successful.');
    } else {
      throw new Error(`Librarian login failed: ${JSON.stringify(libLoginData)}`);
    }

    // ----------------------------------------------------
    // TEST 2: Register a Member
    // ----------------------------------------------------
    console.log('\n⏳ Test 2: Registering a new Member...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Member',
        email: randomEmail,
        password: 'password123'
      })
    });
    const registerData = await registerRes.json();
    if (registerRes.status === 201 && registerData.success) {
      testMemberId = registerData.data.id;
      console.log(`✅ Member registered successfully (ID: ${testMemberId}).`);
    } else {
      throw new Error(`Member registration failed: ${JSON.stringify(registerData)}`);
    }

    // ----------------------------------------------------
    // TEST 3: Login as the new Member
    // ----------------------------------------------------
    console.log('\n⏳ Test 3: Logging in as the new Member...');
    const memLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail,
        password: 'password123'
      })
    });
    const memLoginData = await memLoginRes.json();
    if (memLoginRes.status === 200 && memLoginData.success) {
      memberToken = memLoginData.token;
      console.log('✅ Member login successful.');
    } else {
      throw new Error(`Member login failed: ${JSON.stringify(memLoginData)}`);
    }

    // ----------------------------------------------------
    // TEST 4: RBAC Check (Member tries to add a book - Should Fail)
    // ----------------------------------------------------
    console.log('\n⏳ Test 4: Verifying Role-Based Access Control (Member adding book - expected to fail)...');
    const memAddBookRes = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({
        title: 'Unauthorized Book',
        author: 'Auth',
        isbn: `isbn-${Date.now()}`,
        category: 'Test',
        quantity: 5
      })
    });
    const memAddBookData = await memAddBookRes.json();
    if (memAddBookRes.status === 403) {
      console.log('✅ Correctly blocked Member from adding book (403 Forbidden).');
    } else {
      throw new Error(`RBAC check failed. Member was allowed to add book or server returned wrong status: ${memAddBookRes.status}`);
    }

    // ----------------------------------------------------
    // TEST 5: Add a Book as Librarian
    // ----------------------------------------------------
    const isbn = `isbn-${Date.now()}`;
    console.log('\n⏳ Test 5: Adding a book as Librarian...');
    const libAddBookRes = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${librarianToken}`
      },
      body: JSON.stringify({
        title: 'Node.js Design Patterns',
        author: 'Mario Casciaro',
        isbn: isbn,
        category: 'Programming',
        quantity: 2
      })
    });
    const libAddBookData = await libAddBookRes.json();
    if (libAddBookRes.status === 201 && libAddBookData.success) {
      testBookId = libAddBookData.data._id;
      console.log(`✅ Book added successfully by Librarian (ID: ${testBookId}).`);
    } else {
      throw new Error(`Librarian adding book failed: ${JSON.stringify(libAddBookData)}`);
    }

    // ----------------------------------------------------
    // TEST 6: Get All Books (with search/filter query)
    // ----------------------------------------------------
    console.log('\n⏳ Test 6: Fetching books with search query "Node.js"...');
    const searchRes = await fetch(`${BASE_URL}/books?search=Node.js`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const searchData = await searchRes.json();
    if (searchRes.status === 200 && searchData.success) {
      console.log(`✅ Books retrieved. Count matching search: ${searchData.count}`);
    } else {
      throw new Error(`Searching books failed: ${JSON.stringify(searchData)}`);
    }

    // ----------------------------------------------------
    // TEST 7: Borrow Book as Member
    // ----------------------------------------------------
    console.log('\n⏳ Test 7: Borrowing the book as Member...');
    const borrowRes = await fetch(`${BASE_URL}/books/${testBookId}/borrow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const borrowData = await borrowRes.json();
    if (borrowRes.status === 200 && borrowData.success) {
      console.log('✅ Book borrowed successfully.');
    } else {
      throw new Error(`Borrowing book failed: ${JSON.stringify(borrowData)}`);
    }

    // ----------------------------------------------------
    // TEST 8: Prevent Duplicate Borrowing
    // ----------------------------------------------------
    console.log('\n⏳ Test 8: Trying to borrow the same book again without returning (expected to fail)...');
    const dbBorrowRes = await fetch(`${BASE_URL}/books/${testBookId}/borrow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const dbBorrowData = await dbBorrowRes.json();
    if (dbBorrowRes.status === 400 && !dbBorrowData.success) {
      console.log(`✅ Correctly blocked duplicate borrow. Message: "${dbBorrowData.message}"`);
    } else {
      throw new Error(`Duplicate borrow check failed: ${JSON.stringify(dbBorrowData)}`);
    }

    // ----------------------------------------------------
    // TEST 9: View My Borrowed Books
    // ----------------------------------------------------
    console.log('\n⏳ Test 9: Fetching currently borrowed books list...');
    const myBooksRes = await fetch(`${BASE_URL}/members/me/books`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const myBooksData = await myBooksRes.json();
    if (myBooksRes.status === 200 && myBooksData.success) {
      console.log(`✅ Retrieved borrowed list. Items checked out: ${myBooksData.count}`);
    } else {
      throw new Error(`Fetching borrowed books failed: ${JSON.stringify(myBooksData)}`);
    }

    // ----------------------------------------------------
    // TEST 10: Librarian Deletion Block (Member with active borrow - Expected to Fail)
    // ----------------------------------------------------
    console.log('\n⏳ Test 10: Trying to delete Member with active borrowed book (expected to fail)...');
    const delMemberRes = await fetch(`${BASE_URL}/members/${testMemberId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${librarianToken}` }
    });
    const delMemberData = await delMemberRes.json();
    if (delMemberRes.status === 400 && !delMemberData.success) {
      console.log(`✅ Correctly blocked deleting member. Message: "${delMemberData.message}"`);
    } else {
      throw new Error(`Member deletion safeguard check failed: ${JSON.stringify(delMemberData)}`);
    }

    // ----------------------------------------------------
    // TEST 11: Return Book as Member
    // ----------------------------------------------------
    console.log('\n⏳ Test 11: Returning the borrowed book...');
    const returnRes = await fetch(`${BASE_URL}/books/${testBookId}/return`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const returnData = await returnRes.json();
    if (returnRes.status === 200 && returnData.success) {
      console.log('✅ Book returned successfully.');
    } else {
      throw new Error(`Returning book failed: ${JSON.stringify(returnData)}`);
    }

    // ----------------------------------------------------
    // TEST 12: Delete Member (No active books - Expected to Succeed)
    // ----------------------------------------------------
    console.log('\n⏳ Test 12: Deleting the Member now that the book is returned...');
    const cleanDelRes = await fetch(`${BASE_URL}/members/${testMemberId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${librarianToken}` }
    });
    const cleanDelData = await cleanDelRes.json();
    if (cleanDelRes.status === 200 && cleanDelData.success) {
      console.log('✅ Member deleted successfully.');
    } else {
      throw new Error(`Member clean deletion failed: ${JSON.stringify(cleanDelData)}`);
    }

    console.log('\n🎉 ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! code properly working. 🎉');
  } catch (error) {
    console.error('\n❌ Verification Test Failed:', error.message);
  }
};

runTests();
