import {
    Copy,
    Download,
    Eye,
    Globe,
    Lock,
    Trash2
} from "lucide-react";
import {useNavigate} from "react-router-dom";

const FileListRow = ({ file, onDownload, onDelete, onTogglePublic, onShareLink, getFileIcon }) => {
    const navigate = useNavigate();

    return (
        <tr key={file.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                <div className="flex items-center gap-2">
                    {getFileIcon(file)}
                    {file.name}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {(file.size / 1024).toFixed(1)} KB
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(file.uploadedAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onTogglePublic(file)}
                        className="flex items-center gap-2 cursor-pointer group">
                        {file.isPublic ? (
                            <>
                                <Globe size={16} className="text-green-500" />
                                <span className="group-hover:underline">Public</span>
                            </>
                        ) : (
                            <>
                                <Lock size={16} className="text-gray-500" />
                                <span className="group-hover:underline">Private</span>
                            </>
                        )}
                    </button>
                    {file.isPublic && (
                        <button
                            onClick={() => onShareLink(file.id)}
                            className="flex items-center gap-2 cursor-pointer group text-blue-600">
                            <Copy size={16} />
                            <span className="group-hover:underline">Share Link</span>
                        </button>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex justify-center">
                        <button
                            onClick={() => onDownload(file)}
                            title="Download"
                            className="text-gray-500 hover:text-blue-600">
                            <Download size={18} />
                        </button>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={() => onDelete(file.id)}
                            title="Delete"
                            className="text-gray-500 hover:text-red-600">
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <div className="flex justify-center">
                        {file.isPublic ? (
                            <a
                                href={`/file/${file.id}`}
                                title="View File"
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-500 hover:text-blue-600">
                                <Eye size={18} />
                            </a>
                        ) : (
                            <span className="w-[18px]"></span>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
};

export default FileListRow;
