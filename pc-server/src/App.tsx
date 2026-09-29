import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { auth, db, googleProvider } from './firebase'
import { signInWithPopup } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [localNetworkInfo, setLocalNetworkInfo] = useState<{ ip: string, port: number } | null>(null)
  const [session, setSession] = useState<{ sessionId: string, secret: string } | null>(null)
  const [error, setError] = useState('')

  const [started, setStarted] = useState(false)

  useEffect(() => {
    // Listen for raw network info from main process (which we will secure)
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onPairingInfo((info: any) => {
        setLocalNetworkInfo({ ip: info.ip, port: info.port })
      })
    } else {
      // Mock for web preview
      setLocalNetworkInfo({ ip: '192.168.1.100', port: 8080 })
    }

    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u)
      if (u) setStarted(true)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Once user is logged in and we have network info, write to Firestore
    if (user && localNetworkInfo && !session) {
      const sessionId = Math.random().toString(36).substring(2, 15)
      const secret = Math.random().toString(36).substring(2, 15)
      
      const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId)
      setDoc(sessionRef, {
        ip: localNetworkInfo.ip,
        port: localNetworkInfo.port,
        secret: secret,
        createdAt: new Date()
      }).then(() => {
        setSession({ sessionId, secret })
        // Tell main process what secret to expect
        if ((window as any).electronAPI && (window as any).electronAPI.setUid) {
          (window as any).electronAPI.setUid(secret) 
        }
      }).catch(err => {
        console.error(err)
        setError('Failed to securely register session to Firestore.')
      })
    }
  }, [user, localNetworkInfo, session])

  const login = () => {
    signInWithPopup(auth, googleProvider).catch(err => {
      console.error(err)
      setError(err.message)
    })
  }

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#1e1e2f', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>Deck</h1>
      
      {!started ? (
        <div style={{ marginTop: '100px', maxWidth: '400px' }}>
          <h2>Turn your phone into a powerful PC controller.</h2>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '40px' }}>
            Control your mouse, execute custom keyboard shortcuts, and organize your workflows perfectly.
          </p>
          <button 
            onClick={() => setStarted(true)}
            style={{ padding: '15px 40px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '30px', border: 'none', backgroundColor: '#fff', color: '#1e1e2f' }}
          >
            Get Started
          </button>
        </div>
      ) : !user ? (
        <div style={{ marginTop: '100px', maxWidth: '400px' }}>
          <h2>Secure your connection</h2>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '40px' }}>
            Please sign in to your Google Account. This ensures that only you can control your PC, and keeps your IP address hidden.
          </p>
          <button 
            onClick={login}
            style={{ padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', border: 'none', backgroundColor: '#4285F4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
          >
            Sign in with Google
          </button>
          {error && <p style={{ color: '#ff6b6b', marginTop: '20px' }}>{error}</p>}
        </div>
      ) : (
        <div style={{ marginTop: '30px' }}>
          <p style={{ opacity: 0.8 }}>Logged in as: <strong>{user.email}</strong></p>
          <h2 style={{ marginTop: '40px' }}>Ready to Pair</h2>
          <p style={{ opacity: 0.8 }}>Scan this secure QR code with the Deck mobile app.</p>
          
          {session ? (
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'white', display: 'inline-block', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <QRCodeSVG 
                value={JSON.stringify({ uid: user.uid, sessionId: session.sessionId })} 
                size={220}
                level="M"
              />
            </div>
          ) : (
            <p style={{ marginTop: '50px', color: '#4cc9f0' }}>Securing your connection in the cloud...</p>
          )}

          <div style={{ marginTop: '50px', opacity: 0.6, fontSize: '14px', maxWidth: '400px' }}>
            <p>Your IP address is completely hidden. The QR code only contains a temporary session ID.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
