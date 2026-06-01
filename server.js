import 'dotenv/config';
import express from "express";
import cors from "cors";
import authRoutes        from "./routes/authRoutes.js";
import personasRoutes    from "./routes/personasRoutes.js";
import recursosRoutes    from "./routes/recursosRoutes.js";
import campamentosRoutes from "./routes/campamentosRoutes.js";
import catalogosRoutes   from "./routes/catalogosRoutes.js";
import iaRoutes          from "./routes/iaRoutes.js";
import dashboardRoutes   from "./routes/dashboardRoutes.js";

const app = express(); // app debe existir ANTES de los app.use

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("public/uploads"));

app.use("/auth",               authRoutes);
app.use("/api/v1/personas",    personasRoutes);
app.use("/api/v1/recursos",    recursosRoutes);
app.use("/api/v1/campamentos", campamentosRoutes);
app.use("/api/v1/catalogos",   catalogosRoutes);
app.use("/api/v1/ia",          iaRoutes);
app.use("/api/v1/dashboard",   dashboardRoutes);

if (process.env.NODE_ENV !== "production") {
  const PORT = 3000;
  app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
}

export default app;