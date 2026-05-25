import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GlobalSearchDialog from "@/components/search/GlobalSearchDialog";

const Header = () => {
  const location = useLocation();
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "All Products", path: "/products" },
    { name: "All Stores", path: "/stores" },
    { name: "Today's Deals", path: "/deals" },
    { name: "Top Coupons", path: "/coupons" },
    { name: "Best Offers", path: "/offers", highlight: true },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className={`w-full sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-card/95 backdrop-blur-md shadow-lg' : 'bg-card shadow-sm'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" className="w-6 h-6">
                  <path d="M32 12C21 12 12 21 12 32C12 43 21 52 32 52C37 52 41.5 50 45 47L41 43C38.5 45.5 35.5 47 32 47C23.7 47 17 40.3 17 32C17 23.7 23.7 17 32 17C40.3 17 47 23.7 47 32H42L49 42L56 32H52C52 21 43 12 32 12Z" fill="white"/>
                  <circle cx="32" cy="32" r="6" fill="white"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-bold font-heading text-foreground leading-none">
                  Cash<span className="text-primary">back</span>
                </span>
                <span className="text-[9px] lg:text-[10px] text-muted-foreground leading-tight hidden sm:block">
                  India's Top Cashback Site
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center bg-muted/50 rounded-full px-0.5 py-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative whitespace-nowrap px-2.5 xl:px-3.5 py-1.5 text-xs xl:text-sm font-medium rounded-full transition-all duration-200 ${
                    location.pathname === link.path 
                      ? 'bg-card text-primary shadow-sm' 
                      : 'text-foreground/70 hover:text-foreground hover:bg-card/50'
                  } ${link.highlight ? 'text-primary' : ''}`}
                >
                  {link.name}
                  {link.highlight && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  )}
                </Link>
              ))}
            </div>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-muted/60 hover:bg-muted border border-transparent hover:border-border rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline text-sm">Search...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-background/80 border border-border rounded text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* Divider - Desktop only */}
            <div className="hidden lg:block w-px h-6 bg-border" />

            {/* Auth Section */}
            <div className="hidden md:flex items-center gap-2">
              {isLoading ? (
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 lg:px-3 h-9 rounded-full hover:bg-muted">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xs font-semibold">
                        {(profile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <span className="hidden lg:inline text-sm font-medium max-w-[100px] truncate">
                        {profile?.full_name || user.email?.split('@')[0] || 'User'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" />
                        Profile & Wallet
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link to="/auth?mode=login">
                    <Button variant="ghost" size="sm" className="h-9 px-3 rounded-full text-sm font-medium">
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth?mode=register">
                    <Button size="sm" className="h-9 px-4 rounded-full text-sm font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>



            {/* Mobile Menu Button */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 space-y-4 border-t border-border">
            {/* Mobile Search */}
            <button
              onClick={() => { setIsSearchOpen(true); setIsMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-muted/60 border border-border rounded-xl text-muted-foreground text-left hover:bg-muted transition-colors"
            >
              <Search className="w-5 h-5" />
              <span className="text-sm">Search stores, deals...</span>
            </button>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${
                    location.pathname === link.path 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'hover:bg-muted text-foreground/80'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{link.name}</span>
                  {link.highlight && (
                    <span className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Auth Section - Mobile */}
            <div className="pt-2 border-t border-border">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold">
                      {(profile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-3 h-11 rounded-xl">
                      <User className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-3 h-11 rounded-xl">
                      <Settings className="w-4 h-4" />
                      Profile & Wallet
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-3 h-11 rounded-xl">
                        <Settings className="w-4 h-4" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-3 h-11 rounded-xl"
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to="/auth?mode=login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-11 rounded-xl text-sm font-medium">
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth?mode=register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full h-11 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-primary/90">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <GlobalSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
};

export default Header;
