import type { Metadata } from 'next';
import { FuncionarioApp } from '@/components/funcionario/FuncionarioApp';

export const metadata: Metadata = { title: 'Bandeja de funcionarios', robots: { index: false, follow: false } };

// CSR: the inbox is private, live (socket.io) and interactive, so there is nothing useful to render on the server.
export default function FuncionarioPage() {
  return <FuncionarioApp />;
}
