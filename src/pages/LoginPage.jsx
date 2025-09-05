// src/pages/LoginPage.jsx

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { GoogleIcon } from '../components/Icons';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { language, tr } = useLanguage();

    // Check for verification message on page load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('message') === 'verify-email') {
            setSuccessMessage(tr('accountCreatedSuccess'));
        }
    }, [tr]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // --- 2. Check if the user's email is verified ---
            if (!userCredential.user.emailVerified) {
                setError('لم يتم تفعيل بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.');
                await signOut(auth); // Sign out user until they are verified
                setIsLoading(false);
                return;
            }
            // If verified, the main App.jsx logic will handle redirection.

        } catch (err) {
            setError(tr('loginFailed'));
            console.error(err);
        }
        setIsLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            setError(tr('googleLoginFailed'));
            console.error(err);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    {/* Logo temporarily hidden
            <img src={logo} alt={tr('companyLogo')} className="h-20 mx-auto mb-4" />
            */}
                    <h1 className="text-2xl font-bold text-gray-800">{tr('welcomeToSystem')}</h1>
                    <p className="text-gray-500">{tr('loginToAccess')}</p>
                </div>

                {/* Display success or error messages */}
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center">{error}</p>}
                {successMessage && <p className="text-green-700 bg-green-100 p-3 rounded-lg text-center">{successMessage}</p>}
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{tr('email')}</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{tr('password')}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                        {isLoading ? tr('loggingIn') : tr('login')}
                    </button>
                </form>
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                    <div className="relative bg-white px-2 text-sm text-gray-500">{tr('or')}</div>
                </div>
                <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200">
                    <GoogleIcon />
                    <span>{tr('loginWithGoogle')}</span>
                </button>
                <p className="text-center text-sm text-gray-600">
                    {tr('noAccount')}{' '}
                    <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                        {tr('createNewAccount')}
                    </a>
                </p>
            </div>
        </div>
    );
}