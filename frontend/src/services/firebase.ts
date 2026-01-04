import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

let app: FirebaseApp | null = null
let auth: Auth | null = null

const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
})

const assertConfig = (config: ReturnType<typeof getFirebaseConfig>) => {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'] as const
  const missing = required.filter((key) => !config[key])
  if (missing.length) {
    throw new Error(`Missing Firebase config: ${missing.join(', ')}`)
  }
}

export const getFirebaseApp = () => {
  if (app) {
    return app
  }
  const config = getFirebaseConfig()
  assertConfig(config)
  app = getApps().length ? getApps()[0] : initializeApp(config)
  return app
}

export const getFirebaseAuth = () => {
  if (auth) {
    return auth
  }
  auth = getAuth(getFirebaseApp())
  return auth
}
