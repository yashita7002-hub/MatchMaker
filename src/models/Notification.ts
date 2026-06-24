import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
