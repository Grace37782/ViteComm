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

function makeUpload(fieldName, subDir) {
  const temp = path.join(__dirname, `../../uploads/${subDir}/temp`)
  const perm = path.join(__dirname, `../../uploads/${subDir}`)
  return {
    middleware: multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => { fs.mkdirSync(temp, { recursive: true }); cb(null, temp) },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
          cb(null, unique + (path.extname(file.originalname) || '.jpg'))
        }
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true)
        else cb(new Error('Seules les images sont acceptées.'), false)
      },
      limits: { fileSize: 5 * 1024 * 1024 }
    }).single(fieldName),
    moveToPermanent: (filename) => {
      if (!filename) return null
      const src = path.join(temp, filename)
      const dest = path.join(perm, filename)
      if (fs.existsSync(src)) {
        fs.mkdirSync(perm, { recursive: true })
        fs.renameSync(src, dest)
        return `/uploads/${subDir}/${filename}`
      }
      return null
    }
  }
}

export const { middleware: uploadAvatar, moveToPermanent } = makeUpload('photo', 'avatars')
export const { middleware: uploadMarketImage, moveToPermanent: moveMarketImage } = makeUpload('image', 'markets')
