const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(
    __dirname,
    "../../uploads"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

const allowedTypes = {
    ".pdf": ["application/pdf"],
    ".png": ["image/png"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".webp": ["image/webp"],
    ".txt": ["text/plain"],
    ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    ".xlsx": [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ]
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },

    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName = crypto.randomUUID() + extension;

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,

    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    },

    fileFilter: function (req, file, cb) {
        const extension = path.extname(
            file.originalname
        ).toLowerCase();

        const mimeTypes = allowedTypes[extension];

        if (
            !mimeTypes ||
            !mimeTypes.includes(file.mimetype)
        ) {
            return cb(
                new Error("This file type is not allowed")
            );
        }

        return cb(null, true);
    }
});

const uploadSingleFile = (req, res, next) => {
    upload.single("file")(req, res, function (error) {
        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "File size must not exceed 10 MB"
                });
            }

            return res.status(400).json({
                message: error.message
            });
        }

        if (error) {
            return res.status(400).json({
                message: error.message
            });
        }

        return next();
    });
};

module.exports = {
    uploadSingleFile,
    uploadDirectory
};