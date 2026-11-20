/**
 * SirenAudio: Emergency siren sound player.
 * Combines high-fidelity local audio file playback (/audio/siren.wav)
 * with a Web Audio API synthetic fallback to ensure audible playback across all
 * modern desktop and mobile browsers (Chrome, Edge, Safari, Android).
 *
 * Strict safety rules:
 * - Silent by default.
 * - Starts ONLY on explicit user interaction.
 * - Single-instance guard (prevents audio duplication).
 * - Immediate silence/stop control.
 */

class SirenAudio {
  constructor() {
    this.audioElement = null
    this.audioCtx = null
    this.oscillator = null
    this.modulator = null
    this.gainNode = null
    this.isPlaying = false
    this.listeners = new Set()
  }

  /**
   * Subscribe to playback state changes (isPlaying: boolean)
   */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  _notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.isPlaying)
      } catch (err) {
        console.error('Error in siren listener:', err)
      }
    }
  }

  /**
   * Start the emergency siren.
   * Prioritizes the dedicated local audio file (/audio/siren.wav);
   * seamlessly falls back to synthesized multi-harmonic Web Audio if file playback fails.
   */
  async start() {
    if (this.isPlaying) {
      return
    }

    this.isPlaying = true
    this._notify()

    let filePlaybackSucceeded = false

    // 1. Try local audio asset playback via HTML5 Audio
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      try {
        const audio = new window.Audio()
        if (audio.canPlayType && audio.canPlayType('audio/wav')) {
          const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
            ? import.meta.env.BASE_URL.replace(/\/$/, '')
            : ''
          audio.src = `${baseUrl}/audio/siren.wav`
          audio.preload = 'auto'
          audio.loop = true
          audio.volume = 0.85
          this.audioElement = audio

          const playPromise = audio.play()
          if (playPromise !== undefined) {
            await playPromise
            filePlaybackSucceeded = true
          } else {
            filePlaybackSucceeded = true
          }
        }
      } catch (audioErr) {
        // Autoplay policy or asset load error -> proceed to Web Audio API fallback
        console.warn('HTML5 Audio playback unfulfilled, falling back to Web Audio API synthesizer:', audioErr.message)
        this.audioElement = null
      }
    }

    // 2. If file playback did not start, use synthesized Web Audio API
    if (!filePlaybackSucceeded && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) {
          console.warn('Web Audio API not supported in this browser.')
          return
        }

        this.audioCtx = new AudioCtx()

        // Resume AudioContext if suspended (required by Chrome, Edge, and Android autoplay policies)
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume()
        }

        // Primary tone oscillator: penetrating sawtooth wave
        this.oscillator = this.audioCtx.createOscillator()
        this.oscillator.type = 'sawtooth'
        this.oscillator.frequency.setValueAtTime(750, this.audioCtx.currentTime)

        // Frequency modulator for emergency wailing effect (600Hz to 950Hz sweep at 1.5Hz)
        this.modulator = this.audioCtx.createOscillator()
        this.modulator.type = 'sine'
        this.modulator.frequency.setValueAtTime(1.5, this.audioCtx.currentTime)

        const modGain = this.audioCtx.createGain()
        modGain.gain.setValueAtTime(200, this.audioCtx.currentTime)
        this.modulator.connect(modGain)
        modGain.connect(this.oscillator.frequency)

        // Master volume gain node: clear, audible demo volume (0.35)
        this.gainNode = this.audioCtx.createGain()
        this.gainNode.gain.setValueAtTime(0.35, this.audioCtx.currentTime)

        this.oscillator.connect(this.gainNode)
        this.gainNode.connect(this.audioCtx.destination)

        this.oscillator.start()
        this.modulator.start()
      } catch (synthErr) {
        console.error('Error starting synthetic siren audio:', synthErr)
      }
    }
  }

  /**
   * Immediately stops all siren playback and releases audio resources.
   */
  stop() {
    if (!this.isPlaying && !this.audioElement && !this.audioCtx) {
      return
    }

    // Stop HTML5 Audio
    if (this.audioElement) {
      try {
        this.audioElement.pause()
        this.audioElement.currentTime = 0
        this.audioElement.src = ''
      } catch (err) {
        console.error('Error stopping HTML5 Audio:', err)
      }
      this.audioElement = null
    }

    // Stop Web Audio API
    try {
      if (this.oscillator) {
        this.oscillator.stop()
        this.oscillator.disconnect()
      }
      if (this.modulator) {
        this.modulator.stop()
        this.modulator.disconnect()
      }
      if (this.gainNode) {
        this.gainNode.disconnect()
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(() => {})
      }
    } catch (err) {
      console.error('Error stopping Web Audio:', err)
    } finally {
      this.oscillator = null
      this.modulator = null
      this.gainNode = null
      this.audioCtx = null
      this.isPlaying = false
      this._notify()
    }
  }

  /**
   * Returns current active playback status.
   */
  getStatus() {
    return this.isPlaying
  }
}

export const sirenPlayer = new SirenAudio()
export default sirenPlayer
