let audio: AudioContext | null = null

export function prepareSound() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    audio = null
  }
}

export function playSound() {
  if (!audio || audio.state !== 'running') return
  const context = audio
  for (const [index, frequency] of [523.25, 659.25, 783.99].entries()) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, context.currentTime + index * 0.18)
    gain.gain.linearRampToValueAtTime(0.12, context.currentTime + index * 0.18 + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index * 0.18 + 0.6)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(context.currentTime + index * 0.18)
    oscillator.stop(context.currentTime + index * 0.18 + 0.65)
  }
}
