// ✅ backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { Parser } from "json2csv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ==========================
// 🔧 Middlewares
// ==========================
app.use(cors());
app.use(express.json());

// ==========================
// 🗄️ Conexión a MongoDB
// ==========================
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ ERROR: falta la variable MONGO_URI en .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err);
    process.exit(1);
  });

// ==========================
// 👥 Modelo de Suscriptor
// ==========================
const subscriberSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true },
  ciudad: String,
  edad: String,
  intereses: [String],
  fecha: { type: Date, default: Date.now },
});

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

// ==========================
// 🧪 Ruta de prueba
// ==========================
app.get("/", (req, res) => {
  res.send("🚀 API TCQ Club funcionando correctamente con integración Perfit!");
});

// ==========================
// 📬 Ruta de Suscripción
// ==========================
app.post("/subscribe", async (req, res) => {
  try {
    const { nombre, email, ciudad, edad, intereses } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El email es obligatorio" });
    }

    // 🔹 Guardar en MongoDB
    const nuevo = new Subscriber({ nombre, email, ciudad, edad, intereses });
    await nuevo.save();

    // 🔹 Enviar a Perfit (si está configurado)
    if (process.env.PERFIT_API_KEY && process.env.PERFIT_LIST_ID) {
      const perfitURL = `https://api.myperfit.com/v1/lists/${process.env.PERFIT_LIST_ID}/contacts`;

      const body = {
        email,
        name: nombre || "",
        fields: {
          ciudad: ciudad || "",
          edad: edad || "",
          intereses: intereses?.join(", ") || "",
        },
      };

      try {
        await axios.post(perfitURL, body, {
          headers: {
            Authorization: `Bearer ${process.env.PERFIT_API_KEY}`,
            "Content-Type": "application/json",
          },
        });
        console.log(`✅ ${email} agregado también en Perfit`);
      } catch (err) {
        console.warn("⚠️ Error enviando a Perfit:", err.response?.data || err.message);
      }
    }

    res.json({ message: "✅ Suscripción exitosa" });
  } catch (err) {
    console.error("❌ Error en /subscribe:", err);
    res.status(500).json({ error: "Error al guardar en la base de datos" });
  }
});

// ==========================
// 📋 Listar Suscriptores
// ==========================
app.get("/subscribers", async (req, res) => {
  try {
    const subs = await Subscriber.find().sort({ fecha: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener suscriptores" });
  }
});

// ==========================
// 📦 Exportar CSV
// ==========================
app.get("/subscribers/export", async (req, res) => {
  try {
    const subs = await Subscriber.find();
    const fields = ["nombre", "email", "ciudad", "edad", "intereses", "fecha"];
    const parser = new Parser({ fields });
    const csv = parser.parse(subs);

    res.header("Content-Type", "text/csv");
    res.attachment("subscribers.csv");
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Error exportando CSV" });
  }
});

// ==========================
// 🚀 Levantar servidor
// ==========================
app.listen(PORT, () => {
  console.log(`🔥 Backend escuchando en puerto ${PORT}`);
});
