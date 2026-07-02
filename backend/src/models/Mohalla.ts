import mongoose, { Document, Schema } from 'mongoose';

export interface IMohalla extends Document {
  name: string;
}

const MohallaSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

export default mongoose.model<IMohalla>('Mohalla', MohallaSchema);
