// src/services/photoService.js
// Fotos del registro: elegirlas (cámara o galería) y subirlas a Cloudinary.
// Único lugar de la app que usa expo-image-picker y la API de Cloudinary.
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CLOUDINARY } from '../config/cloudinary';

const PICKER_OPTIONS = {
  mediaTypes: ['images'],
  quality: 1, // sin comprimir aquí: se reduce y comprime una sola vez en reducePhoto
  // iOS: entrega JPEG aunque la foto de la galería esté en HEIC (Cloudinary
  // solo acepta jpg/png en nuestro preset). En Android no tiene efecto.
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
};

// Tamaño máximo del lado mayor de la foto. Con 1280 px se sigue leyendo la
// placa y los documentos, y cada foto pesa unos cientos de KB, no 1,3 MB.
const MAX_PHOTO_SIZE = 1280;

// Reduce la foto (sin deformarla) y la guarda como JPEG comprimido.
// maxWidth/maxHeight reducen la imagen al cargarla: la foto completa de la
// cámara nunca se carga en memoria. Si ya es más pequeña, no se agranda.
async function reducePhoto(uri) {
  const context = ImageManipulator.manipulate(uri, { maxWidth: MAX_PHOTO_SIZE, maxHeight: MAX_PHOTO_SIZE });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return result.uri;
}

// Pide el permiso y abre la cámara o la galería.
// Devuelve { status: 'ok', uri } | { status: 'canceled' } | { status: 'denied' }.
export async function pickPhoto(source) {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: 'denied' };
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled) {
    return { status: 'canceled' };
  }
  return { status: 'ok', uri: await reducePhoto(result.assets[0].uri) };
}

// Sube una foto (uri local del celular) y devuelve su URL https de Cloudinary.
// En Expo SDK 58 el fetch global es el de Expo, que NO acepta el formato viejo
// de React Native { uri, type, name } en FormData ("Unsupported FormDataPart
// implementation"). Acepta un File de expo-file-system, que lee el archivo
// del celular y le pone su nombre y tipo.
export async function uploadPhoto(uri) {
  const body = new FormData();
  body.append('file', new File(uri));
  body.append('upload_preset', CLOUDINARY.uploadPreset);

  const response = await fetch(CLOUDINARY.uploadUrl, { method: 'POST', body });
  if (!response.ok) {
    // fetch NO lanza error con 400 o 500: hay que revisar response.ok a mano.
    const error = new Error(`Cloudinary respondió ${response.status}`);
    error.code = 'photo-upload-failed';
    throw error;
  }
  const data = await response.json();
  return data.secure_url;
}
