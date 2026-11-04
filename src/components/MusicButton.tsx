import { useEffect, useRef, useState } from 'react'

function buildReverb(ctx: AudioContext, duration: number) {
  const rate = ctx.sampleRate
  const len = Math.floor(rate * duration)
  const buf = ctx.createBuffer(2, len, rate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8)
  }
  const conv = ctx.createConvolver()
  conv.buffer = buf
  return conv
}

export default function MusicButton() {
  const [playing, setPlaying] = useState(false)
  const audio = useRef<{ ctx: AudioContext; master: GainNode } | null>(null)

  useEffect(() => {
    const resume = () => { if (audio.current?.ctx.state === 'suspended') audio.current.ctx.resume() }
    document.addEventListener('click', resume)
    return () => {
      document.removeEventListener('click', resume)
      try { audio.current?.ctx.close() } catch { /* ignore */ }
    }
  }, [])

  function start() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const master = ctx.createGain()
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 3)
    const reverb = buildReverb(ctx, 4)
    const revGain = ctx.createGain()
    revGain.gain.value = 0.5
    reverb.connect(revGain); revGain.connect(master); master.connect(ctx.destination)
    const partials = [
      { freq: 136.1, gain: 0.32 }, { freq: 272.2, gain: 0.12 },
      { freq: 408.3, gain: 0.06 }, { freq: 68.05, gain: 0.18 },
    ]
    partials.forEach(({ freq, gain: g }) => {
      const osc = ctx.createOscillator(), gn = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = freq; gn.gain.value = g
      osc.connect(gn); gn.connect(master); gn.connect(reverb)
      const lfo = ctx.createOscillator(), lgn = ctx.createGain()
      lfo.frequency.value = 0.18 + Math.random() * 0.1
      lgn.gain.value = g * 0.08
      lfo.connect(lgn); lgn.connect(gn.gain)
      lfo.start(); osc.start()
    })
    audio.current = { ctx, master }
  }

  function stop() {
    const a = audio.current
    if (!a) return
    a.master.gain.linearRampToValueAtTime(0, a.ctx.currentTime + 2)
    audio.current = null
    setTimeout(() => { try { a.ctx.close() } catch { /* ignore */ } }, 2200)
  }

  function toggle() {
    if (!playing) {
      try { start() } catch { return }
    } else stop()
    setPlaying(!playing)
  }

  return (
    <>
      <button id="music-btn" type="button" className={playing ? 'playing' : undefined}
        aria-label={playing ? 'Stop ambient Om music' : 'Play ambient Om music'} title="Ambient Om music" onClick={toggle}>
        <svg className="mu-note" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>
        <svg className="mu-eq" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="4" height="16" rx="1.5" /><rect x="10" y="4" width="4" height="16" rx="1.5" /><rect x="16" y="4" width="4" height="16" rx="1.5" /></svg>
      </button>
      <div className="music-tooltip" aria-hidden="true">{playing ? 'Ambient Om · Playing ♪' : 'Ambient Om · Click to play'}</div>
    </>
  )
}
