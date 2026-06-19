'use client';

import { useEffect } from 'react';

export default function ThemeInit() {
  useEffect(() => {
    const stored = localStorage.getItem('trialsync-theme');
    const preferDark = stored ? stored === 'dark' : false;
    document.documentElement.classList.toggle('dark', preferDark);
  }, []);
  return null;
}
