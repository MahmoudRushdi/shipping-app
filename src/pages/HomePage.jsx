import logo from '/src/assets/AL-MOSTAKEM-1.png';

export default function HomePage() {
  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <img src={logo} alt="شعار الشركة الكبير" className="mx-auto h-56 w-auto mb-8" />
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl" dir="rtl">
              شركة المستقيم للنقل السريع
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600" dir="rtl">
              سرعة بدون تسّرع، وإتقان بدون تقصير. شريكك اللوجستي الموثوق لتوصيل شحناتك بأمان وفي الوقت المحدد.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/track" // تم تعديل الرابط هنا
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                تتبع شحنتك الآن
              </a>
              <a href="/about" className="text-sm font-semibold leading-6 text-gray-900">
                اعرف المزيد عنا <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
