import React from 'react';
import LoginClient from './LoginClient';

export default function Page() {
  return (
    <React.Suspense fallback={<div />}>
      <LoginClient />
    </React.Suspense>
  );
}
