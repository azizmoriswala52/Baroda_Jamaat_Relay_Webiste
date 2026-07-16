import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  itsId: string;
  password?: string;
  fullName: string;
  email: string;
  mobile: string;
  jamaatName: string;
  mohalla?: string;
  gender?: 'Male' | 'Female';
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  lastLogin?: Date;
  lastIpAddress?: string;
  lastDeviceDetails?: string;
  sessionStartTime?: Date;
  hasRelayAccess: boolean;
}

const UserSchema: Schema = new Schema({
  itsId: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, default: '' },
  mobile: { type: String, required: true },
  jamaatName: { type: String, required: true },
  mohalla: { type: String },
  gender: { type: String, enum: ['Male', 'Female'] },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  lastIpAddress: { type: String },
  lastDeviceDetails: { type: String },
  sessionStartTime: { type: Date },
  hasRelayAccess: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
