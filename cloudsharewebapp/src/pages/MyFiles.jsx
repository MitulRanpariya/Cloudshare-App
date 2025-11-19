import DashboardLayout from "../layout/DashboardLayout.jsx";
import {useEffect, useState} from "react";
import { File, FileIcon, FileText, Grid, Image, List, Music, Video } from "lucide-react";
import {useAuth} from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";
import {useNavigate} from "react-router-dom";
import FileCard from "../components/FileCard.jsx";
import {apiEndpoints} from "../util/apiEndpoints.js";
import ConfirmationDialog from "../components/ConfirmationDialog.jsx";
import LinkShareModal from "../components/LinkShareModal.jsx";
import FileListRow from "../components/FileListRow.jsx";

const MyFiles = () => {
    const [files, setFiles] = useState([]);
    const [viewMode, setViewMode] = useState("list");
    const {getToken} = useAuth();
    const navigate = useNavigate();
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        fileId: null
    });
    const [shareModal, setShareModal] = useState({
        isOpen: false,
        fileId: null,
        link: ""
    });

    //fetching the files for a logged in user
    const fetchFiles = async () => {
        try {
            const token = await getToken();
            console.log(token);
            const response = await axios.get(apiEndpoints.FETCH_FILES, {headers: {Authorization: `Bearer ${token}`}});
            if (response.status === 200) {
                setFiles(response.data);
            }
        }catch (error) {
            console.error('Error fetching the files from server: ', error);
            toast.error('Error fetching the files from server: ', error.message);
        }
    }

    //Toggles the public/private status of a file
    const togglePublic = async (fileToUpdate) => {
        try {
            const token = await getToken();
            await axios.patch(apiEndpoints.TOGGLE_FILE(fileToUpdate.id), {}, {headers: {Authorization: `Bearer ${token}`}});
            console.log('data', fileToUpdate);
            setFiles(files.map((file) => file.id === fileToUpdate.id ? {...file, isPublic: !file.isPublic}: file));
        }catch (error) {
            console.error('Error toggling file status', error);
            toast.error('Error toggling file status: ', error.message);
        }
    }

    //Handle file download
    const handleDownload = async (file) => {
        try {
            const token = await getToken();
            const response = await axios.get(apiEndpoints.DOWNLOAD_FILE(file.id), {headers: {Authorization: `Bearer ${token}`}, responseType: 'blob'});

            // create a blob url and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", file.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // clean up the object url
        }catch (error) {
            console.error('Download failed', error);
            toast.error('Error downloading file', error.message);
        }
    }

    //Closes the delete confirmation modal
    const closeDeleteConfirmation = () => {
        setDeleteConfirmation({
            isOpen: false,
            fileId: null
        })
    }

    //Opens the delete confirmation modal
    const openDeleteConfirmation = (fileId) => {
        setDeleteConfirmation({
            isOpen: true,
            fileId
        })
    }

    //opens the share link modal
    const openShareModal = (fileId) => {
        const link = `${window.location.origin}/file/${fileId}`;
        setShareModal({
            isOpen: true,
            fileId,
            link
        });
    }

    //close the share link modal
    const closeShareModal = () => {
        setShareModal({
            isOpen: false,
            fileId: null,
            link: ""
        });
    }

    //Delete a file after confirmation
    const handleDelete = async () => {
        const fileId = deleteConfirmation.fileId;
        if (!fileId) return;

        try {
            const token = await getToken();
            const response = await axios.delete(apiEndpoints.DELETE_FILE(fileId), {headers: {Authorization: `Bearer ${token}`}});
            if (response.status === 204) {
                setFiles(files.filter((file) => file.id !== fileId));
                closeDeleteConfirmation();
            } else {
                toast.error('Error deleting file');
            }
        }catch (error) {
            console.error('Error deleting file', error);
            toast.error('Error deleting file', error.message);
        }
    }

    useEffect(() => {
        fetchFiles();
    }, [getToken]);

    const getFileIcon = (file) => {
        const extenstion = file.name.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extenstion)) {
            return <Image size={24} className="text-purple-500" />
        }

        if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extenstion)) {
            return <Video size={24} className="text-blue-500" />
        }

        if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extenstion)) {
            return <Music size={24} className="text-green-500" />
        }

        if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extenstion)) {
            return <FileText size={24} className="text-amber-500" />
        }

        return <FileIcon size={24} className="text-purple-500" />
    }

    return (
        <DashboardLayout activeMenu="My Files">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">My Files {files.length}</h2>
                    <div className="flex items-center gap-3">
                        <List
                            onClick={() => setViewMode("list")}
                            size={24}
                            className={`cursor-pointer transition-colors ${viewMode === 'list' ? 'text-blue-600': 'text-gray-400 hover:text-gray-600'}`} />
                        <Grid
                            size={24}
                            onClick={() => setViewMode("grid")}
                            className={`cursor-pointer transition-colors ${viewMode === 'grid' ? 'text-blue-600': 'text-gray-400 hover:text-gray-600'}`} />
                    </div>
                </div>

                {files.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center">
                        <File
                            size={60}
                            className="text-purple-300 mb-4"
                        />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">
                            No files uploaded yet
                        </h3>
                        <p className="text-gray-500 text-center max-w-md mb-6">
                            Start uploading files to see them listed here. you can upload
                            documents, images, and other files to share and manage them securely.
                        </p>
                        <button
                            onClick={() => navigate('/upload')}
                            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors">
                            Go to Upload
                        </button>
                    </div>
                ): viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {files.map((file) => (
                            <FileCard
                                key={file.id}
                                file={file}
                                onDelete={openDeleteConfirmation}
                                onTogglePublic={togglePublic}
                                onDownload={handleDownload}
                                onShareLink={openShareModal}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sharing</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {files.map((file) => (
                                    <FileListRow
                                        key={file.id}
                                        file={file}
                                        onDownload={handleDownload}
                                        onDelete={openDeleteConfirmation}
                                        onTogglePublic={togglePublic}
                                        onShareLink={openShareModal}
                                        getFileIcon={getFileIcon}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Delete confiramtion dialog*/}
                <ConfirmationDialog
                    isOpen={deleteConfirmation.isOpen}
                    onClose={closeDeleteConfirmation}
                    title="Delete File"
                    message="Are you sure want to delete this file? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDelete}
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />

                {/* Share link modal */}
                <LinkShareModal
                    isOpen={shareModal.isOpen}
                    onClose={closeShareModal}
                    link={shareModal.link}
                    title="Share File"
                />
            </div>
        </DashboardLayout>
    )
}

export default MyFiles;