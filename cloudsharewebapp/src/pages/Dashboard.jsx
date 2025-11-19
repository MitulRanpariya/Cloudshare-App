import DashboardLayout from "../layout/DashboardLayout.jsx";
import {useAuth} from "@clerk/clerk-react";
import {useContext, useEffect, useState} from "react";
import {UserCreditsContext} from "../context/UserCreditsContext.jsx";
import axios from "axios";
import {apiEndpoints} from "../util/apiEndpoints.js";
import {Loader2} from "lucide-react";
import DashboardUpload from "../components/DashboardUpload.jsx";
import RecentFiles from "../components/RecentFiles.jsx";

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [remainingUploads, setRemainingUploads] = useState(5);
    const {getToken} = useAuth();
    const { fetchUserCredits } = useContext(UserCreditsContext);
    const MAX_FILES = 5;

    useEffect(() => {
        const fetchRecentFiles = async () => {
            setLoading(true);
            try {
                const token = await getToken();
                // Use the existing endpoint that we know works
                const res = await axios.get(apiEndpoints.FETCH_FILES, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                // Sort by uploadedAt and take only the 5 most recent files
                const sortedFiles = res.data.sort((a, b) =>
                    new Date(b.uploadedAt) - new Date(a.uploadedAt)
                ).slice(0, 5);
                setFiles(sortedFiles);
            } catch (error) {
                console.error("Error fetching recent files:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecentFiles();
    }, [getToken]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        // Check if adding these files would exceed the limit
        if (uploadFiles.length + selectedFiles.length > MAX_FILES) {
            setMessage(`You can only upload a maximum of ${MAX_FILES} files at once.`);
            setMessageType('error');
            return;
        }

        // Add the new files to the existing files
        setUploadFiles(prevFiles => [...prevFiles, ...selectedFiles]);
        setMessage('');
        setMessageType('');
    };

    // Remove a file from the upload list
    const handleRemoveFile = (index) => {
        setUploadFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        setMessage('');
        setMessageType('');
    };

    // Calculate remaining uploads
    useEffect(() => {
        setRemainingUploads(MAX_FILES - uploadFiles.length);
    }, [uploadFiles]);

    // Handle file upload
    const handleUpload = async () => {
        if (uploadFiles.length === 0) {
            setMessage('Please select at least one file to upload.');
            setMessageType('error');
            return;
        }

        if (uploadFiles.length > MAX_FILES) {
            setMessage(`You can only upload a maximum of ${MAX_FILES} files at once.`);
            setMessageType('error');
            return;
        }

        setUploading(true);
        setMessage('Uploading files...');
        setMessageType('info');

        const formData = new FormData();
        uploadFiles.forEach(file => formData.append('files', file));

        try {
            const token = await getToken();
            const response = await axios.post(apiEndpoints.UPLOAD_FILE, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 300000, // 5 minutes timeout for large files
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Upload Progress: ${percentCompleted}%`);
                }
            });

            setMessage('Files uploaded successfully!');
            setMessageType('success');
            setUploadFiles([]);

            // Refresh the recent files list
            const res = await axios.get(apiEndpoints.FETCH_FILES, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            // Sort by uploadedAt and take only the 5 most recent files
            const sortedFiles = res.data.sort((a, b) =>
                new Date(b.uploadedAt) - new Date(a.uploadedAt)
            ).slice(0, 5);

            setFiles(sortedFiles);

            // Refresh user credits immediately after successful upload
            await fetchUserCredits();
        } catch (error) {
            console.error('Error uploading files:', error);
            setMessage(error.response?.data?.message || 'Error uploading files. Please try again.');
            setMessageType('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <DashboardLayout activeMenu="Dashboard">
            <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
                <div className="animate-fade-in-down mb-8">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">My Drive</h1>
                    <p className="text-gray-600 text-lg">Upload, manage, and share your files securely</p>
                </div>
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-slide-in-right shadow-lg border ${
                        messageType === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                            messageType === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                        <div className={`w-1 h-12 rounded-full ${
                            messageType === 'error' ? 'bg-red-500' :
                                messageType === 'success' ? 'bg-green-500' :
                                    'bg-blue-500'
                        }`}></div>
                        <span className="font-medium">{message}</span>
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-6">
                    {/*Left column*/}
                    <div className="w-full md:w-[40%] animate-fade-in-up animation-delay-100">
                        <DashboardUpload
                            files={uploadFiles}
                            onFileChange={handleFileChange}
                            onUpload={handleUpload}
                            uploading={uploading}
                            onRemoveFile={handleRemoveFile}
                            remainingUploads={remainingUploads}
                        />
                    </div>

                    {/*right column*/}
                    <div className="w-full md:w-[60%] animate-fade-in-up animation-delay-200">
                        {loading ? (
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[300px]">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                    <Loader2 size={48} className="text-blue-600 animate-spin mb-4 relative" />
                                </div>
                                <p className="text-gray-600 font-medium">Loading your files...</p>
                            </div>
                        ) : (
                            <RecentFiles files={files} />
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default Dashboard;