import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMP_DIR = path.join(__dirname, '../../uploads/avatars/temp')
const PERM_DIR = path.join(__dirname, '../../uploads/avatars')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
    cb(null, TEMP_DIR)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, unique + ext)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true)
  else cb(new Error('Seules les images sont acceptées.'), false)
}

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('photo')

export function moveToPermanent(filename) {
  if (!filename) return null
  const src = path.join(TEMP_DIR, filename)
  const dest = path.join(PERM_DIR, filename)
  if (fs.existsSync(src)) {
    fs.mkdirSync(PERM_DIR, { recursive: true })
    fs.renameSync(src, dest)
    return `/uploads/avatars/${filename}`
  }
  return null
}
