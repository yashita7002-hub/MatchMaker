import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISavedMessage extends Document {
  userId: mongoose.Types.ObjectId;
  messageId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SavedMessageSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

SavedMessageSchema.index({ userId: 1, messageId: 1 }, { unique: true });

const SavedMessage: Model<ISavedMessage> = mongoose.models.SavedMessage
  || mongoose.model<ISavedMessage>('SavedMessage', SavedMessageSchema);

export default SavedMessage;
