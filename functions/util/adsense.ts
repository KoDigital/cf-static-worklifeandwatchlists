import CryptoJS from 'crypto-js'

const DECRYPT_KEY = 'AU[-u_R[H@9S"/{-Qtk3*IH4"R;LjuU6w1S/ug8##/j4kF.tS4!QtG8^Tw}H(t7'

export const decryptStyle = (value: string): string => {
    try {
        const decrypted = CryptoJS.AES.decrypt(value.replace(/ /g, '+'), DECRYPT_KEY);
        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
        return decryptedStr.toString();
    } catch (err) {
        console.error('adsense', 'failed to decrypt style', value, err)
        return ''
    }
}