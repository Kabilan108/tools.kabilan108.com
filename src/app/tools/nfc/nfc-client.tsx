'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface Status {
  message: string;
  type: 'info' | 'success' | 'error';
}

const statusColors: Record<Status['type'], string> = {
  info: 'bg-info-dim text-info',
  success: 'bg-success-dim text-success',
  error: 'bg-error-dim text-error',
};

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
                showStatus(
                  'Decryption failed \u2014 wrong key or corrupted data',
                  'error',
                );
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
    <div className="flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          &larr; Back
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">NFC Reader/Writer</h1>

        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            nfcSupported ? 'bg-success-dim text-success' : 'bg-error-dim text-error'
          }`}
        >
          {nfcSupported
            ? 'Web NFC is supported on this device'
            : 'Web NFC is not supported on this device/browser'}
        </div>

        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium">Write to NFC Tag</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useEncryption}
                onChange={(e) => setUseEncryption(e.target.checked)}
                className="rounded"
              />
              Enable AES encryption
            </label>

            {useEncryption && (
              <input
                type="password"
                placeholder="Encryption key"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleJsonMode}
                className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-background"
              >
                {useJson ? 'Switch to Text' : 'Switch to JSON'}
              </button>
              {useJson && jsonError && (
                <span className="text-xs text-error">{jsonError}</span>
              )}
            </div>

            {useJson ? (
              <textarea
                value={jsonContent}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
                placeholder='{"key": "value"}'
              />
            ) : (
              <textarea
                value={writeText}
                onChange={(e) => setWriteText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter text to write to tag"
              />
            )}

            <button
              type="button"
              onClick={writeToTag}
              disabled={!nfcSupported}
              className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-background hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Write to Tag
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium">Read from NFC Tag</h2>

          <button
            type="button"
            onClick={readFromTag}
            disabled={!nfcSupported}
            className="rounded-lg bg-info px-4 py-2 text-sm font-medium text-background hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Read from Tag
          </button>

          <textarea
            value={readResult}
            readOnly
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            placeholder="Tag data will appear here"
          />
        </div>

        {status && (
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium ${statusColors[status.type]}`}
          >
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
