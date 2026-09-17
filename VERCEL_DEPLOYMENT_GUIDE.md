# Guía de Despliegue en Vercel & Configuración de APIs

Esta aplicación funciona tanto en el entorno de desarrollo como en **Vercel** utilizando funciones serverless (`/api`) y Vite frontend.

---

## 1. Variables de Entorno en Vercel (Project Settings -> Environment Variables)

Todas las variables son **estrictamente secretas** en el servidor de Vercel (sin ningún prefijo `VITE_` que las exponga en el navegador):

| Variable | Tipo | Descripción | Dónde obtenerla |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Secreta (Server-side)** | Clave de API de Google Gemini para ejecutar el modelo de alta reflexión (`gemini-3.1-pro-preview`). **Nunca se envía al navegador.** | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GOOGLE_CLIENT_ID` | **Secreta (Server-side)** | Client ID de OAuth 2.0 de Google Cloud para interactuar con Drive, Sheets y Calendar. Servido de forma protegida vía `/api/config`. | Google Cloud Console -> Credentials |
| `APP_URL` | **Configuración** | La URL de producción de Vercel (ej: `https://tu-proyecto.vercel.app`). | Panel de Vercel |

> 🔒 **Seguridad Total**: Ninguna clave o token se incrusta en el código fuente ni en el bundle compilado. El frontend consulta dinámicamente `/api/config` al backend, manteniendo todo aislado en las variables de entorno del servidor.

---

## 2. APIs de Google Cloud a Habilitar

En tu consola de **Google Cloud Platform (GCP)** (en el proyecto vinculado `gen-lang-client-0056384592` o tu propio proyecto):

1. Ve a **APIs & Services > Library** (Biblioteca de APIs).
2. Busca y **HABILITA** las siguientes 3 APIs de Google Workspace:
   - **Google Sheets API** (`https://www.googleapis.com/auth/spreadsheets`)
   - **Google Drive API** (`https://www.googleapis.com/auth/drive.file`)
   - **Google Calendar API** (`https://www.googleapis.com/auth/calendar.events`)
3. Asegúrate de que la **Generative Language API** (Gemini) esté habilitada si usas Vertex o clave de GCP.

---

## 3. Configuración de OAuth en Google Cloud Console

1. Ve a **APIs & Services > Credentials** > Edita tu **OAuth 2.0 Client ID** (tipo *Web application*).
2. En **Authorized JavaScript origins** (Orígenes autorizados de JavaScript), añade:
   - `http://localhost:3000` (desarrollo local)
   - Tu dominio de Vercel: `https://tu-proyecto.vercel.app`
   - Cualquier alias personalizado si usas dominio propio (ej. `https://app.tudominio.com`).
3. En **Authorized redirect URIs** (URIs de redireccionamiento autorizados):
   - `https://tu-proyecto.vercel.app`

---

## 4. Estructura de Despliegue en Vercel

- `vercel.json`: Redirige automáticamente todas las peticiones a `/api/*` hacia `/api/index.ts` (función serverless Node.js).
- `dist/`: Generado por `npm run build` (`vite build`) sirviendo el frontend React SPA de alta velocidad.
- `api/index.ts`: Procesa la lógica de análisis estratégico con Gemini 3.1 Pro Thinking Mode sin exponer nunca tu `GEMINI_API_KEY` al navegador.
