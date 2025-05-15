import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export class BotVerificationService {
  constructor(private readonly channelSecret: string) {}

  verifySignature(body: string, signature: string): boolean {
    const hash = bytesToHex(hmac(sha256, this.channelSecret, body));

    // 使用 Web API 替代 Buffer，解決 Edge Runtime 相容性問題
    const hashBytes = new Uint8Array(hash.length / 2);
    for (let i = 0; i < hash.length; i += 2) {
      hashBytes[i / 2] = parseInt(hash.substring(i, i + 2), 16);
    }
    const base64Hash = btoa(String.fromCharCode.apply(null, Array.from(hashBytes)));

    return base64Hash === signature;
  }
}
