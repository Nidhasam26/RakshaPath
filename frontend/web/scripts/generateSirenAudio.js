import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Generates an emergency siren audio file (16-bit 44.1kHz PCM WAV).
 * The frequency modulates between 500 Hz and 940 Hz with a 2-second period,
 * resulting in a 4.0-second seamless loop with harmonic overtone richness.
 */
export function generateSirenAudio(outputDir = path.resolve(__dirname, '../public/audio')) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const sampleRate = 44100
  const durationSec = 4.0
  const numSamples = Math.floor(sampleRate * durationSec)
  const numChannels = 1
  const bytesPerSample = 2
  const dataSize = numSamples * numChannels * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)

  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28)
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  let phase = 0
  const baseFreq = 720
  const modDepth = 220
  const modFreq = 0.5 // 2.0 second cycle

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const instantFreq = baseFreq + modDepth * Math.sin(2 * Math.PI * modFreq * t)
    phase += (2 * Math.PI * instantFreq) / sampleRate
    if (phase > 2 * Math.PI) {
      phase -= 2 * Math.PI
    }

    // Multi-harmonic synthesis for rich, unmistakable emergency acoustic profile
    const s1 = Math.sin(phase)
    const s2 = 0.35 * Math.sin(2 * phase)
    const s3 = 0.15 * Math.sin(3 * phase)
    const sample = (s1 + s2 + s3) / 1.5

    // Scaled to 72% peak amplitude for clear loudness without clipping
    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767 * 0.72)))
    buffer.writeInt16LE(intSample, 44 + i * 2)
  }

  const outPath = path.join(outputDir, 'siren.wav')
  fs.writeFileSync(outPath, buffer)
  return { outPath, bytes: buffer.length }
}

if (process.argv[1] && process.argv[1].endsWith('generateSirenAudio.js')) {
  const result = generateSirenAudio()
  console.log(`Generated siren audio at ${result.outPath} (${result.bytes} bytes)`)
}
