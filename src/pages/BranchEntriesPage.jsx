import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format } from 'date-fns';
import { PlusCircleIcon, SearchIcon, TrashIcon } from '../components/Icons';
import AddBranchEntryModal from '../components/AddBranchEntryModal';
import LinkBolToVehicleModal from '../components/LinkBolToVehicleModal';
import { Link } from 'react-router-dom'; // For navigation
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function BranchEntriesPage() {
    const { language, tr } = useLanguage();
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedBolEntry, setSelectedBolEntry] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

         // Filtering states
     const [filterType, setFilterType] = useState(''); // 'incoming', 'outgoing', or '' for all
          const [filterBranchName, setFilterBranchName] = useState(''); // Branch name search

    // Fetch branch entries from Firestore with filters
    useEffect(() => {
        setIsLoading(true);
        setError('');

        let q = collection(db, 'branch_entries');
        
                 // Apply filters
         const queryConstraints = [];
         if (filterType) {
             queryConstraints.push(where('entryType', '==', filterType));
         }

        q = query(q, ...queryConstraints, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let entriesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString('ar-EG') || 'N/A'
            }));

            // Client-side filtering for branchName
            if (filterBranchName) {
                entriesList = entriesList.filter(entry =>
                    entry.branchName.toLowerCase().includes(filterBranchName.toLowerCase())
                );
            }

            setEntries(entriesList);
            setIsLoading(false);
                    }, (err) => {
                console.error("Error fetching branch entries:", err);
                setError(tr('failedToLoadEntries'));
                setIsLoading(false);
            });

                 return () => unsubscribe(); // Cleanup listener on unmount
     }, [filterType, filterBranchName]); // Re-run effect when filters change

    // Handle entry added/updated success message from modal
    const handleEntryAdded = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
    };

    // Handle deleting an entry
    const handleDeleteEntry = async (entryIdToDelete) => {
        if (!window.confirm(tr("confirmDeleteEntry"))) {
            return;
        }
        try {
            await deleteDoc(doc(db, 'branch_entries', entryIdToDelete));
            setSuccessMessage(tr('entryDeletedSuccess'));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error deleting entry:", err);
            setError(tr('errorDeletingEntry'));
        }
    };

    // Handle linking BOL to vehicle
    const handleLinkToVehicle = (entry) => {
        setSelectedBolEntry(entry);
        setShowLinkModal(true);
    };

    // Handle BOL linked successfully
    const handleBolLinked = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowLinkModal(false);
        setSelectedBolEntry(null);
    };

    return (
        <div className="bg-gray-50 min-h-screen p-8 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{tr('branchEntriesManagement')}</h1>
                        <p className="text-gray-500">{tr('branchEntriesDescription')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200"
                        >
                            <PlusCircleIcon />
                            <span>{tr('addNewEntry')}</span>
                        </button>
                        <Link to="/dashboard" className="text-sm text-indigo-600 hover:underline">
                            {tr('backToMainDashboard')}
                        </Link>
                    </div>
                </div>

                {successMessage && <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center mb-4">{successMessage}</div>}
                {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg text-center mb-4">{error}</div>}

                {/* NEW: Sub-navigation for different entry views */}
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <Link to="/branch-entries" className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-800 font-semibold hover:bg-indigo-200">
                        {tr('allEntries')}
                    </Link>
                    <Link to="/branch-entries/pending-dispatch" className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-semibold hover:bg-yellow-200">
                        {tr('pendingDispatch')}
                    </Link>
                    <Link to="/branch-entries/fully-dispatched" className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold hover:bg-green-200">
                        {tr('fullyDispatched')}
                    </Link>
                </div>

                {/* Filtering Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">{tr('filteringOptions')}</h2>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">{tr('entryType')}</label>
                            <select
                                id="filterType"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="p-2 border rounded-md w-full bg-white"
                            >
                                <option value="">{tr('all')}</option>
                                <option value="incoming">{tr('incoming')}</option>
                                <option value="outgoing">{tr('outgoing')}</option>
                            </select>
                        </div>
                        
                        <div className="relative">
                            <label htmlFor="filterBranchName" className="block text-sm font-medium text-gray-700 mb-1">{tr('branchName')}</label>
                            <input
                                id="filterBranchName"
                                type="text"
                                value={filterBranchName}
                                onChange={(e) => setFilterBranchName(e.target.value)}
                                placeholder={tr('searchByBranchName')}
                                className="p-2 border rounded-md w-full pr-10"
                            />
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pt-6"><SearchIcon className="h-5 w-5 text-gray-400" /></span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold">{tr('entriesList')}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <p className="text-center text-gray-500 p-10">{tr('loadingEntries')}</p>
                        ) : entries.length === 0 ? (
                            <p className="text-center text-gray-500 p-10">{tr('noEntriesCreated')}</p>
                        ) : (
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-100 text-gray-700 uppercase">
                                                                         <tr>
                                         <th className="p-3">{tr('type')}</th>
                                         <th className="p-3">{tr('branchName')}</th>
                                         <th className="p-3">{tr('bolNumber')}</th>
                                         <th className="p-3">{tr('numberOfItems')}</th>
                                         <th className="p-3">{tr('status')}</th>
                                         <th className="p-3">{tr('creationDate')}</th>
                                         <th className="p-3">{tr('actions')}</th>
                                     </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => (
                                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${entry.entryType === 'incoming' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                    {entry.entryType === 'incoming' ? tr('incoming') : tr('outgoing')}
                                                </span>
                                            </td>
                                                                                         <td className="p-3 font-medium">{entry.branchName}</td>
                                             <td className="p-3 font-medium">{entry.bolNumber || tr('notSpecified')}</td>
                                             <td className="p-3">{entry.items?.length || 0}</td>
                                             <td className="p-3">
                                                 <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                     entry.vehicleId ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                 }`}>
                                                     {entry.vehicleId ? tr('linkedToVehicle') : tr('notLinked')}
                                                 </span>
                                             </td>
                                             <td className="p-3">{entry.date}</td>
                                            <td className="p-3">
                                                <div className="flex gap-2 justify-end">
                                                    <Link
                                                        to={`/branch-entries/${entry.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900 font-semibold"
                                                    >
                                                        {tr('viewDetails')}
                                                    </Link>
                                                    {!entry.vehicleId && (
                                                        <button
                                                            onClick={() => handleLinkToVehicle(entry)}
                                                            className="text-green-600 hover:text-green-900 font-semibold"
                                                        >
                                                            {tr('linkToVehicle')}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteEntry(entry.id)}
                                                        className="text-red-600 hover:text-red-900 font-semibold"
                                                    >
                                                        <TrashIcon className="inline-block ml-1" /> {tr('delete')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            {isModalOpen && <AddBranchEntryModal closeModal={() => setIsModalOpen(false)} onEntryAdded={handleEntryAdded} />}
            {showLinkModal && selectedBolEntry && (
                <LinkBolToVehicleModal 
                    closeModal={() => {
                        setShowLinkModal(false);
                        setSelectedBolEntry(null);
                    }} 
                    bolEntry={selectedBolEntry} 
                    onLinked={handleBolLinked} 
                />
            )}
        </div>
    );
}
