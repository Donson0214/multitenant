import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase'
import { setAuthToken } from './http'

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth()
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  const token = await user.getIdToken()
  setAuthToken(token)
  return user
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const { user } = await signInWithPopup(auth, provider)
  const token = await user.getIdToken()
  setAuthToken(token)
  return user
}

export async function registerWithEmail(params: {
  email: string
  password: string
  name?: string
}): Promise<User> {
  const auth = getFirebaseAuth()
  const { user } = await createUserWithEmailAndPassword(auth, params.email, params.password)
  if (params.name) {
    await updateProfile(user, { displayName: params.name })
  }
  const token = await user.getIdToken()
  setAuthToken(token)
  return user
}

export async function signOutUser() {
  const auth = getFirebaseAuth()
  await signOut(auth)
  setAuthToken(null)
}

export const startTokenListener = () => {
  try {
    const auth = getFirebaseAuth()
    return onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken()
        setAuthToken(token)
      } else {
        setAuthToken(null)
      }
    })
  } catch {
    return null
  }
}
