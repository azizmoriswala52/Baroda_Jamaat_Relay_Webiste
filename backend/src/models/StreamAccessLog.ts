import mongoose, { Document, Schema } from 'mongoose';

export interface IStreamAccessLog extends Document {
  userId: mongoose.Types.ObjectId;
  streamId: mongoose.Types.ObjectId;
  action: 'GRANTED' | 'DENIED' | 'EXPIRED' | 'REVOKED';
  ipAddress: string;
  reason?: string;
  createdAt: Date;
}

const StreamAccessLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  streamId: { type: Schema.Types.ObjectId, ref: 'StreamSession', required: true },
  action: { type: String, enum: ['GRANTED', 'DENIED', 'EXPIRED', 'REVOKED'], required: true },
  ipAddress: { type: String, required: true },
  reason: { type: String }
}, { timestamps: true });

export default mongoose.model<IStreamAccessLog>('StreamAccessLog', StreamAccessLogSchema);
