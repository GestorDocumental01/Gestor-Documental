const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qtubzinddtitxalxstcb.supabase.co';
const supabaseKey = 'sb_secret_4msIA4xOtcZhtssNHFX98w_d1xcxw9R'; // Pon tu llave aquí
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrarPDFs() {
    try {
        const rawData = fs.readFileSync('respaldo2026-09-09.json', 'utf8');
        const parsedData = JSON.parse(rawData);

        const documentos = Array.isArray(parsedData) 
            ? parsedData 
            : (parsedData.documentos || parsedData.data || Object.values(parsedData));

        console.log(`📂 Procesando ${documentos.length} elementos...`);

        for (const doc of documentos) {
            // Aquí usamos las propiedades exactas que nos dio tu consola
            const nombreArchivo = doc.nombreArchivo || doc.nombre || 'archivo.pdf';
            const base64Data = doc.archivoData; // Esta es la propiedad correcta

            if (!base64Data) {
                console.warn(`⚠️ Saltando ${nombreArchivo}: 'archivoData' está vacío.`);
                continue;
            }

            // Limpiamos el texto base64 por si trae la cabecera "data:application/pdf;base64,"
            const base64Clean = base64Data.includes('base64,') 
                ? base64Data.split('base64,')[1] 
                : base64Data;

            const buffer = Buffer.from(base64Clean, 'base64');
            
            const { error } = await supabase.storage
                .from('Documentos')
                .upload(nombreArchivo, buffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (error) {
                console.error(`❌ Error al subir ${nombreArchivo}:`, error.message);
            } else {
                console.log(`✅ ¡Subido con éxito: ${nombreArchivo}!`);
            }
        }
        console.log("🎉 ¡Migración finalizada con éxito!");
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

migrarPDFs();