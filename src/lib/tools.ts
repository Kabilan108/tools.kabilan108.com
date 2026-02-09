export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
  requiresAuth: boolean;
  tags: string[];
}

export const tools: ToolDefinition[] = [
  {
    slug: 'nfc',
    name: 'NFC Reader/Writer',
    description: 'Read and write data to NFC tags with optional AES encryption',
    icon: '📱',
    requiresAuth: false,
    tags: ['hardware', 'nfc'],
  },
  {
    slug: 'mermaid',
    name: 'Mermaid Diagram Renderer',
    description: 'Write Mermaid syntax and render beautiful themed diagrams',
    icon: '📊',
    requiresAuth: false,
    tags: ['diagrams', 'visualization'],
  },
];
