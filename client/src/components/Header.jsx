import { Link, useLocation } from 'react-router-dom';

const styles = {
  header: {
    background: '#800000',
    color: '#fff',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    minHeight: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.3,
    padding: '12px 0',
  },
  nav: {
    display: 'flex',
    gap: 24,
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    padding: '8px 0',
    borderBottom: '2px solid transparent',
    transition: 'border-color 0.2s',
  },
  activeLink: {
    borderBottom: '2px solid #fff',
  },
};

export default function Header() {
  const { pathname } = useLocation();

  const linkStyle = (path) => ({
    ...styles.link,
    ...(pathname === path ? styles.activeLink : {}),
  });

  return (
    <header style={styles.header}>
      <div style={styles.title}>UChicago Campus Incident Reporting</div>
      <nav style={styles.nav}>
        <Link to="/" style={linkStyle('/')}>
          Report Incident
        </Link>
        <Link to="/admin" style={linkStyle('/admin')}>
          Admin
        </Link>
      </nav>
    </header>
  );
}
