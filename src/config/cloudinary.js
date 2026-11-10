// src/config/cloudinary.js
// Configuración de Cloudinary (fotos del registro), leída del .env.
// Se usa un "upload preset" SIN FIRMA (Unsigned): la app puede subir fotos sin
// tener el API Secret. El secreto NUNCA va en la app. El Cloud name y el nombre
// del preset no son secretos (el Cloud name aparece en cada URL de imagen).
// Protecciones del preset (consola de Cloudinary): carpeta fija, solo jpg/png,
// sin sobrescribir y con nombre de archivo aleatorio (Disallow public ID).
const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Fail fast, igual que firebase.js: si falta una variable, un mensaje claro.
if (!cloudName || !uploadPreset) {
  throw new Error(
    'Faltan variables de Cloudinary en el .env: EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME y EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET'
  );
}

export const CLOUDINARY = Object.freeze({
  uploadPreset,
  uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
});
