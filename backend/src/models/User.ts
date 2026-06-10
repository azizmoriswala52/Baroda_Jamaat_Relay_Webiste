import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  itsId: string;
  password?: string;
  fullName: string;
  email: string;
  mobile: string;
  jamaatName: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  lastLogin?: Date;
}

const UserSchema: Schema = new Schema({
  itsId: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  jamaatName: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
