'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Prompt,
  Section,
  TuiBackLink,
  TuiButton,
  TuiInput,
  TuiStatus,
  TuiTextarea,
} from '@/components/tui';

interface Status {
  message: string;
  type: 'info' | 'success' | 'error';
}

async function encryptAesGcm(plaintext: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptAesGcm(encoded: string, password: string): Promise<string> {
  const raw = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const ciphertext = raw.slice(28);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plainBuffer);
}

export function NfcClient(): React.ReactElement {
  const [writeText, setWriteText] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [readResult, setReadResult] = useState('');
  const [useJson, setUseJson] = useState(false);
  const [useEncryption, setUseEncryption] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setNfcSupported('NDEFReader' in window);
  }, []);

  const showStatus = useCallback((message: string, type: Status['type']) => {
    setStatus({ message, type });
  }, []);

  const toggleJsonMode = useCallback(() => {
    if (!useJson) {
      try {
        const parsed = JSON.parse(writeText || '{}');
        setJsonContent(JSON.stringify(parsed, null, 2));
        setJsonError(null);
      } catch {
        setJsonContent(writeText);
      }
    } else {
      setWriteText(jsonContent);
      setJsonError(null);
    }
    setUseJson((prev) => !prev);
  }, [useJson, writeText, jsonContent]);

  const handleJsonChange = useCallback((value: string) => {
    setJsonContent(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, []);

  const writeToTag = useCallback(async () => {
    try {
      let dataToWrite: string;
      if (useJson) {
        const parsed = JSON.parse(jsonContent);
        dataToWrite = JSON.stringify(parsed);
      } else {
        dataToWrite = writeText;
      }

      if (!dataToWrite) {
        showStatus('Please enter some text to write', 'error');
        return;
      }

      if (useEncryption && encryptionKey) {
        dataToWrite = await encryptAesGcm(dataToWrite, encryptionKey);
      }

      const ndef = new NDEFReader();
      showStatus('Tap an NFC tag to write to it...', 'info');
      await ndef.write({
        records: [{ recordType: 'text', data: dataToWrite }],
      });
      showStatus('Successfully wrote to NFC tag!', 'success');
    } catch (e) {
      showStatus(e instanceof Error ? e.message : 'Failed to write to tag', 'error');
    }
  }, [useJson, jsonContent, writeText, useEncryption, encryptionKey, showStatus]);

  const readFromTag = useCallback(async () => {
    try {
      const ndef = new NDEFReader();
      showStatus('Tap an NFC tag to read from it...', 'info');
      await ndef.scan();

      ndef.addEventListener('reading', async (event) => {
        for (const record of event.message.records) {
          if (record.recordType === 'text' && record.data) {
            const decoder = new TextDecoder();
            let text = decoder.decode(record.data);

            if (useEncryption && encryptionKey) {
              try {
                text = await decryptAesGcm(text, encryptionKey);
              } catch {
                showStatus('Decryption failed — wrong key or corrupted data', 'error');
                return;
              }
            }

            setReadResult(text);
            showStatus('Successfully read from NFC tag!', 'success');
          }
        }
      });
    } catch (e) {
      showStatus(e instanceof Error ? e.message : 'Failed to read from tag', 'error');
    }
  }, [useEncryption, encryptionKey, showStatus]);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-4 text-sm leading-relaxed">
      <TuiBackLink />

      <div className="mt-4">
        <Prompt command="man nfc" />
      </div>

      <div className="mt-2">
        <Section heading="NAME">
          <p>
            <span className="font-bold text-foreground">nfc</span>
            <span className="text-muted">
              {' '}
              — read and write NFC tags with AES encryption
            </span>
          </p>
        </Section>

        <Section heading="STATUS">
          <p className={nfcSupported ? 'text-success' : 'text-error'}>
            Web NFC: {nfcSupported ? 'supported' : 'not supported'}
          </p>
        </Section>

        <Section heading="OPTIONS">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useEncryption}
                onChange={(e) => setUseEncryption(e.target.checked)}
              />
              <span className="text-foreground">--encrypt</span>
              <span className="text-muted">Enable AES-GCM encryption</span>
            </label>

            {useEncryption && (
              <div className="ml-[5ch]">
                <span className="text-foreground">--key=</span>
                <TuiInput
                  type="password"
                  placeholder="encryption key"
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  className="mt-1 max-w-xs"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-foreground">--format=</span>
              <TuiButton onClick={toggleJsonMode}>
                {useJson ? 'json' : 'text'}
              </TuiButton>
              {useJson && jsonError && <span className="text-error">{jsonError}</span>}
            </div>
          </div>
        </Section>

        <Section heading="WRITE">
          <div className="space-y-2">
            {useJson ? (
              <TuiTextarea
                value={jsonContent}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={8}
                spellCheck={false}
                className="max-w-lg font-mono"
                placeholder='{"key": "value"}'
              />
            ) : (
              <TuiTextarea
                value={writeText}
                onChange={(e) => setWriteText(e.target.value)}
                rows={4}
                className="max-w-lg"
                placeholder="Enter text to write to tag"
              />
            )}
            <div>
              <TuiButton onClick={writeToTag} disabled={!nfcSupported}>
                [write to tag]
              </TuiButton>
            </div>
          </div>
        </Section>

        <Section heading="READ">
          <div className="space-y-2">
            <div>
              <TuiButton onClick={readFromTag} disabled={!nfcSupported}>
                [read from tag]
              </TuiButton>
            </div>
            <TuiTextarea
              value={readResult}
              readOnly
              rows={4}
              className="max-w-lg"
              placeholder="Tag data will appear here"
            />
          </div>
        </Section>

        {status && (
          <div className="mt-3">
            <TuiStatus type={status.type} message={status.message} />
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">
        <Prompt />
        <span className="cursor-blink text-success">█</span>
      </div>
    </div>
  );
}
