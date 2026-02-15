export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  requiresAuth: boolean;
  tags: string[];
}

export const tools: ToolDefinition[] = [
  {
    slug: 'nfc',
    name: 'NFC Reader/Writer',
    description: 'Read and write data to NFC tags with optional AES encryption',
    requiresAuth: false,
    tags: ['hardware', 'nfc'],
  },
  {
    slug: 'mermaid',
    name: 'Mermaid Diagram Renderer',
    description: 'Write Mermaid syntax and render beautiful themed diagrams',
    requiresAuth: false,
    tags: ['diagrams', 'visualization'],
  },
];
