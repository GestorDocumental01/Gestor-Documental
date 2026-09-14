const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Tus credenciales de Supabase
const supabaseUrl = 'https://qtubzinddtitxalxstcb.supabase.co';
const supabaseKey = 'sb_publishable_JMiF4OEzJh7xDOiMjRaBuA_zS9R7Vnv';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para procesar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Asegurar que la carpeta 'uploads' exista
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configuración de Multer para capturar el archivo en memoria temporalmente
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Servir archivos estáticos (como HTML, CSS, JS) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

// Ruta para subir archivos a la nube (Supabase Storage)
app.post('/upload', upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se subió ningún archivo.');
        }

        const fileName = Date.now() + '-' + req.file.originalname;

        const { data, error } = await supabase.storage
            .from('documentos')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Error al subir a Supabase:', error);
            return res.status(500).json({ error: error.message });
        }

        const { data: publicUrlData } = supabase.storage
            .from('documentos')
            .getPublicUrl(fileName);

        res.json({
            mensaje: '¡Archivo subido exitosamente a la nube!',
            url: publicUrlData.publicUrl,
            nombreOriginal: req.file.originalname
        });

    } catch (err) {
        console.error('Error en el servidor:', err);
        res.status(500).send('Error interno en el servidor.');
    }
});

// Ruta de inicio de sesión conectada a la tabla 'usuarios' en Supabase
app.post('/login', async (req, res) => {
    try {
        // Captura segura tanto si el campo se llama 'usuario' o 'usuarios'
        const usuarioIngresado = req.body.usuario || req.body.usuarios;
        const password = req.body.password;

        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuarios', usuarioIngresado)
            .eq('password', password)
            .single();

        if (error || !data) {
            return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
        }

        res.json({ success: true, message: "¡Inicio de sesión exitoso!" });
    } catch (err) {
        console.error('Error en el login:', err);
        res.status(500).json({ success: false, message: "Error interno" });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});