import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white" dir="rtl">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 lg:px-8">
        <p className="text-center text-xs leading-5 text-gray-500">
          &copy; {new Date().getFullYear()} شركة المستقيم. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
