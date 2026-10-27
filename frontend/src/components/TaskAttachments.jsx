import { useEffect, useState } from "react";

import {
    getTaskAttachments,
    uploadTaskAttachment,
    downloadTaskAttachment,
    deleteTaskAttachment
} from "../services/attachmentApi";

import "./TaskAttachments.css";

function TaskAttachments({ projectId, taskId }) {
    const [attachments, setAttachments] = useState([]);
    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadAttachments = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getTaskAttachments(
                projectId,
                taskId
            );

            setAttachments(data.attachments);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to load attachments"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttachments();
    }, [projectId, taskId]);

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!file) {
            setError("Please select a file");
            return;
        }

        try {
            setUploading(true);
            setError("");
            setMessage("");

            await uploadTaskAttachment(
                projectId,
                taskId,
                file
            );

            setFile(null);
            event.target.reset();

            setMessage("File uploaded successfully");

            await loadAttachments();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to upload file"
            );
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (attachment) => {
        try {
            setError("");

            const blob = await downloadTaskAttachment(
                projectId,
                attachment._id
            );

            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = downloadUrl;
            link.download = attachment.originalName;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to download file"
            );
        }
    };

    const handleDelete = async (attachmentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this attachment?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setMessage("");

            await deleteTaskAttachment(
                projectId,
                attachmentId
            );

            setMessage("Attachment deleted successfully");

            await loadAttachments();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to delete attachment"
            );
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <section className="attachments-section">
            <div className="attachments-heading">
                <div>
                    <h2>Attachments</h2>
                    <p>Files shared with this task</p>
                </div>

                <span className="attachment-count">
                    {attachments.length} files
                </span>
            </div>

            <form
                className="attachment-upload-form"
                onSubmit={handleUpload}
            >
                <label htmlFor="attachment-file">
                    Choose a file
                </label>

                <input
                    id="attachment-file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.xlsx"
                    onChange={(event) =>
                        setFile(event.target.files[0] || null)
                    }
                />

                <p className="attachment-hint">
                    PDF, images, TXT, DOCX or XLSX. Maximum 10 MB.
                </p>

                <button
                    type="submit"
                    disabled={!file || uploading}
                >
                    {uploading ? "Uploading..." : "Upload File"}
                </button>
            </form>

            {error && (
                <p className="attachment-error">{error}</p>
            )}

            {message && (
                <p className="attachment-success">{message}</p>
            )}

            {loading ? (
                <p>Loading attachments...</p>
            ) : attachments.length === 0 ? (
                <p className="attachment-empty">
                    No attachments yet. Upload the first file.
                </p>
            ) : (
                <div className="attachment-list">
                    {attachments.map((attachment) => (
                        <div
                            className="attachment-item"
                            key={attachment._id}
                        >
                            <div className="attachment-file-icon">
                                <span>FILE</span>
                            </div>

                            <div className="attachment-info">
                                <strong>
                                    {attachment.originalName}
                                </strong>

                                <span>
                                    {formatFileSize(attachment.size)}
                                </span>

                                <span>
                                    Uploaded by{" "}
                                    {attachment.uploadedBy?.name ||
                                        "Team member"}
                                </span>
                            </div>

                            <div className="attachment-actions">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDownload(attachment)
                                    }
                                >
                                    Download
                                </button>

                                <button
                                    type="button"
                                    className="attachment-delete"
                                    onClick={() =>
                                        handleDelete(attachment._id)
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default TaskAttachments;