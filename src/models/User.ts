import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRepository {
  name: string;
  description: string;
  language: string;
  stars: number;
  url: string;
}

export interface IUser extends Document {
  githubUsername: string;
  name: string;
  avatarUrl: string;
  bio: string;
  repositories: IRepository[];
  status: 'Available' | 'Busy' | 'Looking for Team' | 'Looking for Projects';
  skills: string[];
  roles: string[];
  trustScore: number;
  reviewsCount: number;
  ratingsSum: {
    communication: number;
    technicalSkills: number;
    reliability: number;
    teamwork: number;
  };
}

const UserSchema: Schema = new Schema({
  githubUsername: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  bio: { type: String, default: '' },
  repositories: [
    {
      name: { type: String, required: true },
      description: { type: String, default: '' },
      language: { type: String, default: '' },
      stars: { type: Number, default: 0 },
      url: { type: String, default: '' },
    },
  ],
  status: {
    type: String,
    enum: ['Available', 'Busy', 'Looking for Team', 'Looking for Projects'],
    default: 'Available',
  },
  skills: [{ type: String }],
  roles: [{ type: String }],
  trustScore: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  ratingsSum: {
    communication: { type: Number, default: 0 },
    technicalSkills: { type: Number, default: 0 },
    reliability: { type: Number, default: 0 },
    teamwork: { type: Number, default: 0 },
  },
}, { timestamps: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
