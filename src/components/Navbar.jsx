export function Navbar({ user, onMenu, onLogout }) {
  return <header className="mobile-navbar"><button className="icon-btn" onClick={onMenu}><i className="bi bi-list" /></button><b>AquaFlow</b>{user && <button className="icon-btn" onClick={onLogout}><i className="bi bi-box-arrow-right" /></button>}</header>;
}
export default Navbar;
