import connectDB from './db';
import User from '@/models/User';

export async function getSessionUser(req: Request) {
  console.log(process.env.MONGODB_URI);
  await connectDB();
  
  
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/session_user_id=([^;]+)/);
  if (!match) return null;
  
  const userId = match[1];
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    return null;
  }
}

export function serializeSessionCookie(userId: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return `session_user_id=${userId}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${isProduction ? '; Secure' : ''}`;
}

export function serializeClearCookie(): string {
  return `session_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}
