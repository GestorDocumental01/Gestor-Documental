const { createClient } = require('@supabase/supabase-js');

// Tus credenciales de Supabase
const supabaseUrl = 'https://qtubzinddtitxalxstcb.supabase.co';
const supabaseKey = 'sb_publishable_JMiF4OEzJh7xDOiMjRaBuA_zS9R7Vnv';
const supabase = createClient(supabaseUrl, supabaseKey);

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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
// Hacer que la carpeta 'uploads' sea accesible públicamente para descargar o ver los archivos
app.use('/uploads', express.static(uploadDir));


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