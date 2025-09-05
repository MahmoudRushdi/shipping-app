import { useLanguage } from '../hooks/useLanguage.jsx';

export default function NotFoundPage() {
  const { language, tr } = useLanguage();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">{tr('pageNotFound')}</h2>
        <p className="text-gray-500 mb-8">
          {tr('pageNotFoundDescription')}
        </p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {tr('home')}
        </a>
      </div>
    </div>
  );
}
