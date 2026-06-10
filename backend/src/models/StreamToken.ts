import mongoose, { Document, Schema } from 'mongoose';

export interface IStreamToken extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  streamId: mongoose.Types.ObjectId;
  originUrl: string;
  expiresAt: Date;
  isValid: boolean;
  ipAddress: string;
  createdAt: Date;
}

const StreamTokenSchema: Schema = new Schema({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  streamId: { type: Schema.Types.ObjectId, ref: 'StreamSession', required: true },
  originUrl: { type: String, required: true }, // The actual HLS url to proxy to
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete document when expired
  isValid: { type: Boolean, default: true },
  ipAddress: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IStreamToken>('StreamToken', StreamTokenSchema);
