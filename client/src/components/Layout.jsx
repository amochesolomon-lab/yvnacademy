import { useState, useEffect, useRef } from 'react';
import { apiUrl, resolveAssetUrl, apiFetch } from '../lib/api';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Grid, Sun, Moon, LogOut, Menu, Home, BookOpenText, Info, LayoutDashboard, Heart, UserRoundPlus, LogIn } from 'lucide-react';

export default function Layout() {
  const { user, logout, flashMessages } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const searchRef = useRef(null);
  const desktopMenuRef = useRef(null);

  useEffect(() => {
    const metaByPath = [
      { match: /^\/$/, title: 'YVN Academy | Practical Digital Skills', description: 'Discover practical courses in design, technology, business, and personal growth.' },
      { match: /^\/about$/, title: 'About YVN Academy', description: 'Learn how YVN Academy helps students build practical digital and life skills.' },
      { match: /^\/courses/, title: 'Browse Courses | YVN Academy', description: 'Explore available courses and search by topic, instructor, or delivery type.' },
      { match: /^\/course\/[^/]+$/, title: 'Course Details | YVN Academy', description: 'View course details, ratings, and secure access options for enrolled students.' },
      { match: /^\/dashboard$/, title: 'Dashboard | YVN Academy', description: 'Manage enrolled courses, wishlist items, purchases, and admin tools.' },
      { match: /^\/login$/, title: 'Log In | YVN Academy', description: 'Sign in to access your YVN Academy dashboard and course content.' },
      { match: /^\/register$/, title: 'Sign Up | YVN Academy', description: 'Create a YVN Academy account to start learning and tracking progress.' },
    ];

    const current = metaByPath.find((entry) => entry.match.test(location.pathname)) || {
      title: 'YVN Academy',
      description: 'Practical courses and branded learning dashboards for students and admins.'
    };

    document.title = current.title;

    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute('content', current.description);
  }, [location.pathname]);

  // Sync theme class with body
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Close mobile drawer and dropdowns on path change
    setMobileOpen(false);
    setCategoriesOpen(false);
    setDesktopMenuOpen(false);
    setShowSuggestions(false);
  }, [location.pathname]);

  // Fetch courses list for search autocomplete
  useEffect(() => {
    apiFetch('/api/courses')
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch((err) => console.error('Error fetching courses for search:', err));
  }, []);

  // Handle outside click to hide suggestions & categories dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
        setDesktopMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const filtered = courses.filter((c) =>
      c.title.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (title) => {
    setSearchQuery(title);
    setShowSuggestions(false);
    navigate(`/courses?q=${encodeURIComponent(title)}`);
  };

  return (
    <div className="page-animate visible">
      {/* MOBILE NAV OVERLAY + DRAWER */}
      <div
        className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      ></div>
      <div className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`}>
        <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
          &times;
        </button>
        <div className="mobile-nav-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '24px' }}>
          <Link to="/">
            <img
              src={resolveAssetUrl('YVN Academy logo.png','images','/static/images/YVN Academy logo.png')}
              alt="YVN Academy"
              className="logo-img"
            />
          </Link>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            style={{ width: '36px', height: '36px' }}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/about">About</Link>
        {user ? (
          <>
            {user.isAdmin ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/admin/purchases">Purchases</Link>
                <Link to="/admin/courses">Manage Courses</Link>
                <Link to="/admin/students">Students</Link>
                <Link to="/admin/add-course">Add Course</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard">My Courses</Link>
                <Link to="/wishlist">Wishlist</Link>
              </>
            )}
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="mobile-nav-login"
              style={{
                background: 'none',
                border: 'none',
                textAlign: 'left',
                padding: '12px 24px',
                cursor: 'pointer',
                font: 'inherit',
                color: 'inherit',
                width: '100%',
                display: 'block'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mobile-nav-login">
              Login
            </Link>
            <Link to="/register" className="mobile-nav-signup">
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* NAVBAR */}
      <nav className="navbar">
        <Link to="/" className="logo">
          <img
            src={resolveAssetUrl('YVN Academy logo.png','images','/static/images/YVN Academy logo.png')}
            alt="YVN Academy"
            className="logo-img"
          />
        </Link>

        {/* Categories dropdown */}
        <div className="nav-categories" style={{ position: 'relative' }}>
          <button
            className="categories-btn"
            onClick={() => setCategoriesOpen(!categoriesOpen)}
          >
            <Grid size={16} /> Categories
          </button>
          {categoriesOpen && (
            <div className="categories-dropdown" style={{ display: 'block' }}>
              <Link to="/courses?category=Web Development">Web Development</Link>
              <Link to="/courses?category=Graphic Design">Graphic Design</Link>
              <Link to="/courses?category=Artificial Intelligence">Artificial Intelligence</Link>
              <Link to="/courses?category=Business & Finance">Business &amp; Finance</Link>
              <Link to="/courses?category=CopyWriting">CopyWriting</Link>
              <Link to="/courses?category=Public Speaking">Public Speaking</Link>
              <Link to="/courses?category=Personal Development">Personal Development</Link>
            </div>
          )}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="search-bar" ref={searchRef}>
          <span className="search-icon" style={{ top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search for anything"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
          />
          {showSuggestions && (
            <div className="search-suggestions" style={{ display: 'block' }}>
              {suggestions.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleSuggestionClick(course.title)}
                >
                  {course.title}
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Nav Links (Desktop) */}
        <div className="nav-links nav-links-desktop">
          <Link to="/" className="nav-pill">
            <Home size={15} /> Home
          </Link>
          <Link to="/courses" className="nav-pill">
            <BookOpenText size={15} /> Courses
          </Link>
          <Link to="/about" className="nav-pill">
            <Info size={15} /> About
          </Link>

          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>

          <div className="desktop-menu-wrap" ref={desktopMenuRef}>
            <button
              onClick={() => setDesktopMenuOpen((prev) => !prev)}
              className="desktop-menu-btn"
              aria-label="Open additional navigation"
              aria-expanded={desktopMenuOpen}
            >
              <Menu size={18} />
            </button>

            {desktopMenuOpen && (
              <div className="desktop-menu-dropdown">
                <div className="desktop-menu-section">
                  <p className="desktop-menu-title">Browse</p>
                  <Link to="/courses?category=Web Development" onClick={() => setDesktopMenuOpen(false)}>Web Development</Link>
                  <Link to="/courses?category=Graphic Design" onClick={() => setDesktopMenuOpen(false)}>Graphic Design</Link>
                  <Link to="/courses?category=Artificial Intelligence" onClick={() => setDesktopMenuOpen(false)}>Artificial Intelligence</Link>
                  <Link to="/courses?category=Business & Finance" onClick={() => setDesktopMenuOpen(false)}>Business & Finance</Link>
                </div>

                <div className="desktop-menu-section">
                  <p className="desktop-menu-title">Account</p>
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setDesktopMenuOpen(false)}>
                        {user.isAdmin ? <LayoutDashboard size={15} /> : <BookOpenText size={15} />} Dashboard
                      </Link>
                      <Link to="/wishlist" onClick={() => setDesktopMenuOpen(false)}>
                        <Heart size={15} /> Wishlist
                      </Link>
                      {user.isAdmin && (
                        <>
                          <Link to="/admin/purchases" onClick={() => setDesktopMenuOpen(false)}>Purchases</Link>
                          <Link to="/admin/courses" onClick={() => setDesktopMenuOpen(false)}>Manage Courses</Link>
                          <Link to="/admin/students" onClick={() => setDesktopMenuOpen(false)}>Students</Link>
                          <Link to="/admin/add-course" onClick={() => setDesktopMenuOpen(false)}>Add Course</Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          navigate('/');
                          setDesktopMenuOpen(false);
                        }}
                        className="desktop-menu-logout"
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setDesktopMenuOpen(false)}>
                        <LogIn size={15} /> Login
                      </Link>
                      <Link to="/register" onClick={() => setDesktopMenuOpen(false)}>
                        <UserRoundPlus size={15} /> Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hamburger (Mobile menu trigger) */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* FLASH MESSAGES / TOAST NOTIFICATIONS */}
      {flashMessages.length > 0 && (
        <div className="flash-messages">
          {flashMessages.map((msg) => (
            <div key={msg.id} className="flash-msg">
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* PAGE CONTENT */}
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-col">
            <div className="footer-logo">
              <img
                src={resolveAssetUrl('YVN Academy logo.png','images','/static/images/YVN Academy logo.png')}
                alt="YVN Academy"
                className="footer-logo-img"
              />
            </div>
            <p>Learn anything. Grow faster. Build your future.</p>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a
              href="https://wa.me/2349017186100?text=Good%20day%20ma'am%2C%20I%20want%20to%20Join%20Yielded%20Vessel%20Network%2C%20or%2C%20I%20have%20a%20question"
              target="_blank"
              rel="noreferrer"
            >
              Help Center
            </a>
            <a
              href="https://wa.me/2349017186100?text=Good%20day%20ma'am%2C%20I%20want%20to%20Join%20Yielded%20Vessel%20Network%2C%20or%2C%20I%20have%20a%20question"
              target="_blank"
              rel="noreferrer"
            >
              Contact
            </a>
            <a href="#">Privacy Policy</a>
          </div>
          <div className="footer-col">
            <h4>Community</h4>
            <a
              href="https://wa.me/2349017186100?text=Good%20day%20ma'am%2C%20I%20want%20to%20Join%20Yielded%20Vessel%20Network%2C%20or%2C%20I%20have%20a%20question"
              target="_blank"
              rel="noreferrer"
            >
              Affiliates
            </a>
            <a
              href="https://wa.me/2349017186100?text=Good%20day%20ma'am%2C%20I%20want%20to%20become%20an%20instructor%20in%20YVN%20Academy"
              target="_blank"
              rel="noreferrer"
            >
              Teach on YVN
            </a>
            <a
              href="https://wa.me/2349017186100?text=Good%20day%20ma'am%2C%20I%20want%20to%20Join%20Yielded%20Vessel%20Network%2C%20or%2C%20I%20have%20a%20question"
              target="_blank"
              rel="noreferrer"
            >
              Referrals
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 YVN Academy. All rights reserved.</span>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/2349017186100?text=Good%20day%20ma'am%2C%20I%20have%20a%20question"
        target="_blank"
        rel="noreferrer"
        className="whatsapp-bubble"
        title="Chat with us on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          width="28"
          height="28"
          fill="white"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>
      </a>
    </div>
  );
}
