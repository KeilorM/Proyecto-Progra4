import pool from "../db/connection.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registrarLog } from "../middleware/logger.js"; 

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Usuario WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol_sistema, campamento: user.campamento_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

  
    await registrarLog({
      usuario_id: user.id,
      campamento_id: user.campamento_id,
      accion: "LOGIN",
      entidad_afectada: "Usuario",
      entidad_id: user.id,
      detalle: { resultado: "exitoso" },
      ip_origen: req.ip,
    });

    res.json({ token, id: user.id, rol: user.rol_sistema, campamento: user.campamento_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};