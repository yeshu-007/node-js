const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function(req, file, cb){ cb(null, uploadDir); },
  filename: function(req, file, cb){
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9\-]/gi,'').slice(0,30);
    cb(null, base + '-' + Date.now() + ext);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

router.post('/', upload.array('photos', 6), (req, res) => {
  try{
    const files = req.files || [];
    const urls = files.map(f => `/uploads/${f.filename}`);
    res.json({ uploaded: true, urls });
  } catch(err){
    console.error('upload error', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;
