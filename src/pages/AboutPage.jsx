import { useLanguage } from '../hooks/useLanguage.jsx';

export default function AboutPage() {
  const { language, tr } = useLanguage();
  
  return (
    <div className="bg-white py-24 sm:py-32" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">{tr('about')}</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {tr('aboutTitle')}
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {tr('aboutDescription')}
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            {/* يمكنك إضافة المزيد من التفاصيل هنا */}
        </div>
      </div>
    </div>
  );
}
