import 'dotenv/config';
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import personasRoutes from "./routes/personasRoutes.js";
import recursosRoutes from "./routes/recursosRoutes.js";
import campamentosRoutes from "./routes/campamentosRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/api/v1/personas", personasRoutes);
app.use("/api/v1/recursos", recursosRoutes);
app.use("/api/v1/campamentos", campamentosRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));