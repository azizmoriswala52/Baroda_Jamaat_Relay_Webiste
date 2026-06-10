import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const makeAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    await mongoose.connect(mongoUri);
    const itsIdToUpdate = '40421333';
    
    const user = await User.findOne({ itsId: itsIdToUpdate });
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('1234', 10);

    if (!user) {
      const newUser = new User({
        itsId: itsIdToUpdate,
        password: hashedPassword,
        fullName: 'System Admin',
        email: 'admin@example.com',
        mobile: '0000000000',
        jamaatName: 'Baroda Jamaat',
        role: 'ADMIN'
      });
      await newUser.save();
    } else {
      user.role = 'ADMIN';
      user.password = hashedPassword;
      await user.save();
    }
    console.log(`Successfully reset user 40421333 to ADMIN with password '1234'.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

makeAdmin();
