import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User';

const seedUser = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/jamaat-relay');
    console.log('Connected to MongoDB');

    const itsId = '40421333';
    const password = '1234';

    // Check if user exists
    const existingUser = await User.findOne({ itsId });
    if (existingUser) {
      console.log('User already exists, updating password...');
      existingUser.password = await bcrypt.hash(password, 10);
      await existingUser.save();
      console.log('User password updated.');
    } else {
      console.log('Creating new user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        itsId,
        password: hashedPassword,
        fullName: 'Admin User',
        email: 'admin@barodajamaat.com',
        mobile: '+91 9999999999',
        jamaatName: 'Baroda Jamaat',
        role: 'ADMIN',
        isActive: true
      });
      await newUser.save();
      console.log('User created successfully.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
};

seedUser();
