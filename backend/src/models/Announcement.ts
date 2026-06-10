import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  content: string;
  type: 'SCHEDULE' | 'UPDATE';
  time: string; // E.g., '14:00' or 'Today, 14:00'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema(
  {
    content: { type: String, required: true },
    type: { type: String, enum: ['SCHEDULE', 'UPDATE'], required: true },
    time: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
