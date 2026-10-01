import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    navigate(query.trim() ? `/shop?search=${encodeURIComponent(query.trim())}` : '/shop');
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-ink/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="font-display text-2xl tracking-tight text-plum shrink-0">
            Zarro
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink/80">
            <Link to="/shop" className="hover:text-plum focus-ring">Shop</Link>
            <Link to="/shop?category=men" className="hover:text-plum focus-ring">Men</Link>
            <Link to="/shop?category=women" className="hover:text-plum focus-ring">Women</Link>
            <Link to="/shop?category=kids" className="hover:text-plum focus-ring">Kids</Link>
          </nav>

          <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-xs">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="w-full border border-ink/20 bg-white/60 px-3 py-1.5 text-sm focus-ring rounded-none"
              aria-label="Search products"
            />
          </form>

          <div className="hidden md:flex items-center gap-4 text-sm shrink-0">
            <Link to="/cart" className="relative hover:text-plum focus-ring" aria-label="Cart">
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-plum text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="relative group">
                <button className="hover:text-plum focus-ring">{user.name.split(' ')[0]}</button>
                <div className="absolute right-0 top-full w-44 bg-white border border-ink/10 shadow-sm hidden group-hover:block">
                  <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-ivory">My orders</Link>
                  {isAdmin && (
                    <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-ivory">Admin panel</Link>
                  )}
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm hover:bg-ivory">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hover:text-plum focus-ring">Login</Link>
            )}
          </div>

          <button
            className="md:hidden p-2 focus-ring"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className="block w-6 h-0.5 bg-ink mb-1.5" />
            <span className="block w-6 h-0.5 bg-ink mb-1.5" />
            <span className="block w-6 h-0.5 bg-ink" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-ink/10 bg-ivory px-4 py-4 space-y-3">
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="w-full border border-ink/20 bg-white px-3 py-2 text-sm focus-ring"
            />
          </form>
          <Link to="/shop" onClick={() => setMenuOpen(false)} className="block py-1">Shop</Link>
          <Link to="/shop?category=men" onClick={() => setMenuOpen(false)} className="block py-1">Men</Link>
          <Link to="/shop?category=women" onClick={() => setMenuOpen(false)} className="block py-1">Women</Link>
          <Link to="/shop?category=kids" onClick={() => setMenuOpen(false)} className="block py-1">Kids</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)} className="block py-1">Cart ({itemCount})</Link>
          {user ? (
            <>
              <Link to="/orders" onClick={() => setMenuOpen(false)} className="block py-1">My orders</Link>
              {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block py-1">Admin panel</Link>}
              <button onClick={() => { logout(); setMenuOpen(false); }} className="block py-1 text-left w-full">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-1">Login</Link>
          )}
        </div>
      )}
    </header>
  );
}
