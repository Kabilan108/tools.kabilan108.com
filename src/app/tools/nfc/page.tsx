import type { Metadata } from 'next';
import { NfcClient } from './nfc-client';

export const metadata: Metadata = {
  title: 'NFC Reader/Writer',
  description: 'Read and write NFC tags with optional AES encryption',
};

export default function NfcPage(): React.ReactElement {
  return <NfcClient />;
}
