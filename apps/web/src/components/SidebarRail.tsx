import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './SidebarRail.module.css';

type NavItem = {
  to: string;
  label: string;
  short: string;
  icon: keyof typeof icons;
};

const icons = {
  home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6h14M5 12h14M5 18h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3v4M17 3v4M4 9h16M6 9v10h12V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 19h16M7 16v-4M12 16v-7M17 16v-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6h6l2 2h8v10H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const navItems: NavItem[] = [
  { to: '/', label: 'Resumo', short: 'Resumo', icon: 'home' },
  { to: '/lancamentos', label: 'Lançamentos', short: 'Lanç.', icon: 'list' },
  { to: '/categorias', label: 'Categorias', short: 'Cat.', icon: 'folder' },
  { to: '/fixos', label: 'Fixos', short: 'Fixos', icon: 'calendar' },
  { to: '/metas', label: 'Metas', short: 'Metas', icon: 'target' },
  { to: '/relatorios', label: 'Relatórios', short: 'Relat.', icon: 'chart' },
];

export default function SidebarRail() {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const handle = () => setIsMobile(media.matches);
    handle();
    media.addEventListener('change', handle);
    return () => media.removeEventListener('change', handle);
  }, []);

  useEffect(() => {
    const width = expanded || hovered ? '184px' : '72px';
    document.documentElement.style.setProperty('--rail-width', width);
  }, [expanded, hovered]);

  const isOpen = expanded || hovered;

  return (
    <aside
      className={`${styles.rail} ${isOpen ? styles.open : ''} ${expanded ? styles.expanded : ''}`}
      onMouseEnter={() => {
        if (!isMobile) setHovered(true);
      }}
      onMouseLeave={() => {
        if (!isMobile) setHovered(false);
      }}
    >
      <div className={styles.logo}>FL</div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.icon}>{icons[item.icon]}</span>
            <span className={styles.label} data-short={item.short}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
      <button
        className={styles.toggle}
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
      >
        {expanded ? '<<' : '>>'}
      </button>
    </aside>
  );
}
