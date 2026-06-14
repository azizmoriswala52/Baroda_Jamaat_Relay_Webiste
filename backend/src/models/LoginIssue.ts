import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginIssue extends Document {
  itsId: string;
  issueDescription: string;
  createdAt: Date;
}

const LoginIssueSchema: Schema = new Schema({
  itsId: { type: String, required: true },
  issueDescription: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ILoginIssue>('LoginIssue', LoginIssueSchema);
