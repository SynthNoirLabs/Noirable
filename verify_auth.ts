import { getProvider } from './src/lib/ai/factory'

try {
    const auth = getProvider()
    console.log('Provider resolved:', auth.type)
} catch (e) {
    console.error('Provider resolution failed:', e)
}
