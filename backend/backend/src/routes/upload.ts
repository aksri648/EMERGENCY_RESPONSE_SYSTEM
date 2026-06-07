import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../services/cloudinary';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image uploads are allowed'));
  },
});

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
    const { url, publicId } = await uploadImage(req.file.buffer);
    res.json({ url, publicId });
  } catch (e) {
    console.error('[/upload] error:', e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
