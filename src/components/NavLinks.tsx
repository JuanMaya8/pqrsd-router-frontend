'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/radicar', label: 'Radicar' },
  { href: '/consulta', label: 'Consultar' },
  { href: '/transparencia', label: 'Transparencia' },
];

export function NavLinks() {
  const path = usePathname() ?? '';
  const current = (href: string): 'page' | undefined => ((href === '/' ? path === '/' : path.startsWith(href)) ? 'page' : undefined);
  return (
    <nav className="nav" aria-label="Principal">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={current(l.href)}>
          {l.label}
        </Link>
      ))}
      <Link href="/funcionario" className="nav-staff" aria-current={current('/funcionario')}>
        <Icon name="lock" size={16} />Funcionarios
      </Link>
    </nav>
  );
}
