import { cookies } from 'next/headers';
import connectDB from './db';
import User from '@/models/User';

const SESSION_COOKIE = 'session_user_id';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_MAX_AGE,
    path: '/',
  };
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser(_req?: Request) {
  const userId = await getSessionUserId();
  if (!userId) return null;

  await connectDB();

  try {
    return await User.findById(userId);
  } catch {
    return null;
  }
}

export async function setSessionUser(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, sessionCookieOptions());
}

export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
