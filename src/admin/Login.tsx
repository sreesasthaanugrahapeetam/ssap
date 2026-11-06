import { FormEvent, useState } from 'react'
import { PASSCODE } from './types'

/** Dummy passcode gate (real auth comes with Supabase). */
export default function Login({ onEnter }: { onEnter: () => void }) {
  const [pass, setPass] = useState('')
  const [bad, setBad] = useState(false)
  const submit = (e: FormEvent) => { e.preventDefault(); if (pass === PASSCODE) onEnter(); else setBad(true) }
  return (
    <div className="a-login">
      <form className="box" onSubmit={submit}>
        <h1>శ్రీ శాస్త్ర అనుగ్రహ పీఠం</h1>
        <p>Devotee Manager · Admin</p>
        <label htmlFor="admin-pass">Passcode</label>
        <input id="admin-pass" type="password" placeholder="Enter passcode" autoComplete="current-password" autoFocus value={pass} onChange={(e) => setPass(e.target.value)} />
        {bad && <div className="err" role="alert">Wrong passcode</div>}
        <button className="btn btn-block mt14">Enter</button>
        <div className="hint muted">Demo passcode: <b>swamiye</b>. Prototype only, not secure.</div>
      </form>
    </div>
  )
}
