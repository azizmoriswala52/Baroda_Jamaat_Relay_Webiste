import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteAnnouncementResponse extends Document {
  announcementId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  response: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  submissionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SiteAnnouncementResponseSchema: Schema = new Schema({
  announcementId: { type: Schema.Types.ObjectId, ref: 'SiteAnnouncement', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  response: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'], default: 'PENDING' },
  submissionCount: { type: Number, default: 0 },
}, { timestamps: true });

// Prevent multiple responses from same user for same announcement
SiteAnnouncementResponseSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ISiteAnnouncementResponse>('SiteAnnouncementResponse', SiteAnnouncementResponseSchema);
