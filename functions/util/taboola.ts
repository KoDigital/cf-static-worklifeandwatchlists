import CryptoJS from 'crypto-js'
import base64url from 'base64url'

const DECRYPT_KEY = 'ac40c7da1ab6b6b8e21ad458dafd40dc'

export const decryptCPC = (value: string): number => {
    try {
        // Handle a case where the value was *not* encrypted:
        if (!isNaN(Number(value))) return parseFloat(value)

        const decrypted = CryptoJS.AES.decrypt(
            base64url.toBase64(decodeURIComponent(value)),
            CryptoJS.enc.Hex.parse(DECRYPT_KEY),
            { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 },
        )
        const decryptedStr = CryptoJS.enc.Utf8.stringify(decrypted).toString()
        // 1.23_1612281007670
        return parseFloat(decryptedStr.split('_')[0])
    } catch (err) {
        console.error('taboola', 'failed to decrypt cpc', value, err)
        return -1
    }
}
