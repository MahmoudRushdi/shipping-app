import { useState, useEffect } from 'react';
// --- Import query and where to check for existing users ---
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';


// --- Updated AddUserModal to prevent duplicates ---
function AddUserModal({ closeModal, onUserAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
        // --- KEY CHANGE: Check if the email already exists ---
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // If the query is not empty, a user with this email exists
            setError("هذا البريد الإلكتروني مسجل بالفعل.");
            setIsSubmitting(false);
            return;
        }
        // If we get here, the email is unique, so we can add it
        await addDoc(usersRef, { email, role });
      
        onUserAdded(`تمت إضافة المستخدم ${email} بنجاح.`);
        closeModal();

    } catch (err) {
      console.error("Error adding user: ", err);
      setError('حدث خطأ أثناء إضافة المستخدم.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">إضافة موظف جديد</h2>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني للموظف</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-2 border rounded-md w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">الصلاحية</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="p-2 border rounded-md w-full bg-white"
            >
              <option value="customer">زبون (Customer)</option>
              <option value="employee">موظف (Employee)</option>
              <option value="admin">مدير (Admin)</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={closeModal} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 font-semibold">
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- Main AdminPage component (no major changes needed here, but included for completeness) ---
export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      let usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const roleOrder = { admin: 1, employee: 2, customer: 3 };
      usersList.sort((a, b) => (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4));
      
      setUsers(usersList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const handleUserAdded = (message) => {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRoleChange = async (userId, newRole) => {
    const userRef = doc(db, 'users', userId);
    try {
        await updateDoc(userRef, {
            role: newRole
        });
        setSuccessMessage('تم تحديث الصلاحية بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
        console.error("Error updating role: ", error);
        alert("حدث خطأ أثناء تحديث الصلاحية.");
    }
  };

   const handleDeleteUser = async (userId) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.")) {
        try {
            await deleteDoc(doc(db, 'users', userId));
            setSuccessMessage('تم حذف المستخدم بنجاح.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
             console.error("Error deleting user: ", error);
             alert("حدث خطأ أثناء حذف المستخدم.");
        }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <a href="/dashboard" className="text-sm text-indigo-600 hover:underline">
            → العودة إلى لوحة التحكم
          </a>
        </div>
        
        {successMessage && <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center mb-4">{successMessage}</div>}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">قائمة المستخدمين</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700">
              إضافة مستخدم جديد
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-10 text-center text-gray-400">جاري تحميل المستخدمين...</div>
            ) : (
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-3">البريد الإلكتروني</th>
                    <th className="p-3">الصلاحية</th>
                    <th className="p-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b">
                      <td className="p-3">{user.email}</td>
                      <td className="p-3 w-48">
                        {auth.currentUser?.uid === user.id ? (
                             <span className={`px-2 py-1 text-xs rounded-full font-semibold ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {user.role === 'admin' ? 'مدير (أنت)' : user.role}
                            </span>
                        ) : (
                            <select 
                                value={user.role} 
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className={`w-full p-1 border-none rounded-md text-xs font-semibold ${
                                    user.role === 'admin' ? 'bg-green-100 text-green-800' : 
                                    user.role === 'employee' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-gray-100 text-gray-800'
                                }`}
                            >
                                <option value="customer">زبون</option>
                                <option value="employee">موظف</option>
                                <option value="admin">مدير</option>
                            </select>
                        )}
                      </td>
                      <td className="p-3">
                         {auth.currentUser?.uid !== user.id && (
                             <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {users.length === 0 && !isLoading && (
                <div className="p-10 text-center text-gray-400">لا يوجد مستخدمون لعرضهم.</div>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && <AddUserModal closeModal={() => setIsModalOpen(false)} onUserAdded={handleUserAdded} />}
    </div>
  );
}