// src/pages/SignUpPage.jsx

import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';


export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState(''); // --- NEW: State for phone number ---
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            setIsLoading(false);
            return;
        }

        // --- NEW: Basic phone number validation ---
        if (!phone.trim()) {
            setError('يرجى إدخال رقم الهاتف.');
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);

            // --- NEW: Save phone number to the user's document ---
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                phone: phone.trim(), // Save the phone number
                role: 'customer'
            });

            await signOut(auth);
            
            window.location.href = '/login?message=verify-email';

        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('هذا البريد الإلكتروني مستخدم بالفعل.');
            } else {
                setError('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
            }
            console.error(err);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    {/* Logo temporarily hidden
            <img src={logo} alt="شعار الشركة" className="h-20 mx-auto mb-4" />
            */}
                    <h1 className="text-2xl font-bold text-gray-800">إنشاء حساب جديد</h1>
                    <p className="text-gray-500">انضم إلينا لتتبع شحناتك بسهولة</p>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center">{error}</p>}
                <form onSubmit={handleSignUp} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                    {/* --- NEW: Phone Number Input Field --- */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                        <input 
                            type="tel" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)} 
                            required 
                            placeholder="e.g., 0912345678"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">كلمة المرور</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">تأكيد كلمة المرور</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                    >
                        {isLoading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
                    </button>
                </form>
                 <p className="text-center text-sm text-gray-600">
                    لديك حساب بالفعل؟{' '}
                    <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        سجل الدخول
                    </a>
                </p>
            </div>
        </div>
    );
}
