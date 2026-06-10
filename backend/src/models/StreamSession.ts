import mongoose, { Document, Schema } from 'mongoose';

export interface IStreamSession extends Document {
  title: string;
  speaker: string;
  description: string;
  servers: { name: string; url: string }[];
  streamType: 'YOUTUBE' | 'HLS' | 'RTMP';
  isLive: boolean;
  scheduledDate: Date;
  viewCount: number;
  thumbnail: string;
}

const StreamSessionSchema: Schema = new Schema({
  title: { type: String, required: true },
  speaker: { type: String, required: true },
  description: { type: String, default: '' },
  servers: [{
    name: { type: String, required: true },
    url: { type: String, required: true }
  }],
  streamType: { type: String, enum: ['YOUTUBE', 'HLS', 'RTMP'], default: 'YOUTUBE' },
  isLive: { type: Boolean, default: false },
  scheduledDate: { type: Date, required: true },
  viewCount: { type: Number, default: 0 },
  thumbnail: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model<IStreamSession>('StreamSession', StreamSessionSchema);
