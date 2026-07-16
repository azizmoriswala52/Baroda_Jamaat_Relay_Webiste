import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteAnnouncement extends Document {
  title: string;
  content: string;
  responseType: string;
  rsvpOptions?: string[];
  targetParentMohallas?: string[];
  targetChildMohallas?: string[];
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SiteAnnouncementSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  responseType: { type: String, enum: ['NONE', 'APPROVAL', 'RSVP'], default: 'APPROVAL' },
  rsvpOptions: { type: [String], default: [] },
  targetParentMohallas: { type: [String], default: ['All'] },
  targetChildMohallas: { type: [String], default: ['All'] },
  deadline: { type: Date },
}, { timestamps: true });

export default mongoose.model<ISiteAnnouncement>('SiteAnnouncement', SiteAnnouncementSchema);
