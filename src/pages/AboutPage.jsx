import React from 'react';

export default function AboutPage() {
  return (
    <div className="bg-white py-24 sm:py-32" dir="rtl">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">من نحن</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            كل ما تحتاجه لتوصيل شحناتك
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            في شركة المستقيم، نؤمن بأن كل شحنة هي وعد. وعد بالسرعة، وعد بالأمان، ووعد بالثقة. نحن هنا لنكون شريكك الذي تعتمد عليه في كل خطوة من خطوات سلسلة التوريد الخاصة بك.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            {/* يمكنك إضافة المزيد من التفاصيل هنا */}
        </div>
      </div>
    </div>
  );
}
