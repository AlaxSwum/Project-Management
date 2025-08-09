'use client';

import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Registration is disabled for internal-use only
  redirect('/login');
} 