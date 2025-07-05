const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
if(process.env.NODE_ENV!="production"){
    require("dotenv").config();
}

cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wonderplace_dev',
    allowedformats: ["png","jpg","jpeg"] // supports promises as well
    // public_id: (req, file) => 'computed-filename-using-request',
  },
});

module.exports = {
    cloudinary,
    storage
}