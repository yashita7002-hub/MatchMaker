import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  description: string;
  loggedBy: string;
  createdAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true, default: 'Others' },
  description: { type: String, default: '' },
  loggedBy: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
