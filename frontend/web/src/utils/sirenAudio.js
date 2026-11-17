/**
 * Web Audio API Siren Player for emergency demo.
 * Silent by default: produces sound only when explicitly triggered by user action.
 */

class SirenAudio {
  constructor() {
    this.audioCtx = null
    this.oscillator = null
    this.gainNode = null
    this.modulator = null
    this.isPlaying = false
  }

  start() {
    if (this.isPlaying) return

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) {
        console.warn('Web Audio API not supported in this browser.')
        return
      }

      this.audioCtx = new AudioCtx()

      // Primary tone oscillator
      this.oscillator = this.audioCtx.createOscillator()
      this.oscillator.type = 'sawtooth'
      this.oscillator.frequency.setValueAtTime(750, this.audioCtx.currentTime)

      // Frequency modulator for wailing effect (600Hz to 950Hz modulation)
      this.modulator = this.audioCtx.createOscillator()
      this.modulator.type = 'sine'
      this.modulator.frequency.setValueAtTime(1.5, this.audioCtx.currentTime) // 1.5 Hz cycle

      const modGain = this.audioCtx.createGain()
      modGain.gain.setValueAtTime(200, this.audioCtx.currentTime)
      this.modulator.connect(modGain)
      modGain.connect(this.oscillator.frequency)

      // Master volume gain node
      this.gainNode = this.audioCtx.createGain()
      this.gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime) // Gentle demo volume

      this.oscillator.connect(this.gainNode)
      this.gainNode.connect(this.audioCtx.destination)

      this.oscillator.start()
      this.modulator.start()
      this.isPlaying = true
    } catch (error) {
      console.error('Error starting siren audio:', error)
    }
  }

  stop() {
    if (!this.isPlaying) return

    try {
      if (this.oscillator) {
        this.oscillator.stop()
        this.oscillator.disconnect()
      }
      if (this.modulator) {
        this.modulator.stop()
        this.modulator.disconnect()
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close()
      }
    } catch (error) {
      console.error('Error stopping siren audio:', error)
    } finally {
      this.oscillator = null
      this.modulator = null
      this.audioCtx = null
      this.gainNode = null
      this.isPlaying = false
    }
  }

  getStatus() {
    return this.isPlaying
  }
}

export const sirenPlayer = new SirenAudio()
export default sirenPlayer
