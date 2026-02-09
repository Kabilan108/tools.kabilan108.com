import type { Metadata } from 'next';
import MermaidClient from './mermaid-client';

export const metadata: Metadata = {
  title: 'Mermaid Editor',
  description: 'Create and preview Mermaid diagrams with custom themes',
};

export default function MermaidPage(): React.ReactElement {
  return <MermaidClient />;
}
