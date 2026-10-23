import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExpensePaymentStatus = 'Pending' | 'Awaiting Verification' | 'Paid' | 'Rejected';

export interface IExpenseParticipant {
  userId: mongoose.Types.ObjectId;
  shareAmount: number;
  status: ExpensePaymentStatus;
  claimedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
}

export interface IExpense extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  description: string;
  loggedBy: string;
  loggedById?: mongoose.Types.ObjectId;
  participants: IExpenseParticipant[];
  createdAt: Date;
}

const ExpenseParticipantSchema = new Schema<IExpenseParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  shareAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Awaiting Verification', 'Paid', 'Rejected'],
    default: 'Pending',
    required: true,
  },
  claimedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
}, { _id: false });

const ExpenseSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true, default: 'Others' },
  description: { type: String, required: true, trim: true },
  loggedBy: { type: String, required: true },
  loggedById: { type: Schema.Types.ObjectId, ref: 'User' },
  participants: { type: [ExpenseParticipantSchema], default: [] },
}, { timestamps: { createdAt: true, updatedAt: false } });

const cachedExpenseModel = mongoose.models.Expense as Model<IExpense> | undefined;
if (cachedExpenseModel && !cachedExpenseModel.schema.path('participants')) {
  mongoose.deleteModel('Expense');
}

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
