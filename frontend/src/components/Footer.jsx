export default function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-xl text-plum mb-2">Zarro</p>
          <p className="text-sm text-ink/60 max-w-xs">
            Beauty from independent brands, curated for skin and hair that ask for the real thing.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-wide text-ink/50 mb-3">Shop</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li>Skincare</li>
            <li>Makeup</li>
            <li>Haircare</li>
            <li>Fragrance</li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-wide text-ink/50 mb-3">Help</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li>Shipping</li>
            <li>Returns</li>
            <li>Order status</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-wide text-ink/50 mb-3">Company</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li>About Zarro</li>
            <li>Our brands</li>
            <li>Careers</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink/10 py-4 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} Zarro. All rights reserved.
      </div>
    </footer>
  );
}
