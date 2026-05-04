import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const carpeta = `public/uploads/personas`;
    fs.mkdirSync(carpeta, { recursive: true });
    cb(null, carpeta);
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const filtro = (_req, file, cb) => {
  const tipos = ["image/jpeg", "image/png", "image/webp"];
  if (tipos.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Solo se permiten imágenes JPEG, PNG o WebP"));
};

export const uploadPersona = multer({
  storage,
  fileFilter: filtro,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).fields([
  { name: "foto",     maxCount: 1 },
  { name: "tarjeta",  maxCount: 1 },
]);