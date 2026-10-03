//cloudinary
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 2. Setup CloudinaryStorage to store images in cloud
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "taskDaily", // Folder name in your Cloudinary dashboard
    resource_type: "raw", //for zip file
  },
});

module.exports = {
  cloudinary,
  storage,
};
