import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportQuery extends Document {
  name: string;
  mobile: string;
  city: string;
  mohalla: string;
  query: string;
  createdAt: Date;
}

const SupportQuerySchema: Schema = new Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  city: { type: String, required: true },
  mohalla: { type: String, required: true },
  query: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISupportQuery>('SupportQuery', SupportQuerySchema);
