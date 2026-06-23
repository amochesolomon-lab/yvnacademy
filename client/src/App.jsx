import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import {
  Star,
  Eye,
  Trash,
  Check,
  X,
  ShieldAlert,
  Award,
  Users,
  Cpu,
  FileText,
  Video,
  Compass,
  Landmark,
  BookOpenText,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  Info,
  Heart,
  ShoppingBag,
  PlusCircle,
  LayoutDashboard,
  UserCheck,
} from "lucide-react";

import { apiUrl, apiFetch } from "./lib/api";

const resolveMediaSrc = (value, folder, fallback = "") => {
  if (!value) return fallback;
  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }
  // Use apiUrl so assets load from configured API base when deployed separately
  // URL-encode filenames to handle spaces and special chars
  const filename = encodeURIComponent(value);
  return folder ? apiUrl(`/static/${folder}/${filename}`) : fallback;
};

const resolveImageSrc = (value) =>
  resolveMediaSrc(value, "images", "/static/images/placeholder.png");
const resolveReceiptSrc = (value) => resolveMediaSrc(value, "receipts", "");

const HERO_SLIDES = [
  {
    label: "Featured Course",
    title: "Learn AI Without Limits",
    subtitle: "Build skills with AI tools and real projects",
    button: "Coming Soon!!",
    image: "hero.png",
    link: "/course/1",
  },
  {
    label: "Coming Soon!!",
    title: "Master Graphic Design",
    subtitle: "Learn Branding, Flyers, and Modern Design like a Pro",
    button: "Explore Course",
    image: "graphics 2.png",
    link: "/course/2",
  },
  {
    label: "Coming Soon!!",
    title: "AI for Designers",
    subtitle: "Use AI tools to speed up your workflow",
    button: "Join Now",
    image: "graphics 3.png",
    link: "/course/3",
  },
];

// ==============================================================
// ROUTING GUARDS
// ==============================================================
function ProtectedRoute({ children }) {
  const { user, loading, addFlash } = useAuth();
  if (loading)
    return (
      <div
        className="container"
        style={{ padding: "40px", textAlign: "center" }}
      >
        Loading...
      </div>
    );
  if (!user) {
    addFlash("Please log in to continue.");
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, addFlash } = useAuth();
  if (loading)
    return (
      <div
        className="container"
        style={{ padding: "40px", textAlign: "center" }}
      >
        Loading...
      </div>
    );
  if (!user || !user.isAdmin) {
    addFlash("Admin access required.");
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// ==============================================================
// PAGES
// ==============================================================

// 1. HOME PAGE
function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTopic, setActiveTopic] = useState("All");
  const heroData = HERO_SLIDES;

  // Fetch courses
  useEffect(() => {
    apiFetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Hero slider auto-change
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 15000); // 15 seconds
    return () => clearInterval(timer);
  }, []);

  // Topics/Categories inner lists
  const topicsList = [
    "All",
    "Web Development",
    "Graphic Design",
    "AI & Machine Learning",
    "Business",
    "CopyWriting",
    "Public Speaking",
    "Personal Development",
  ];

  // Filtering logic
  const filteredCourses = courses.filter((c) => {
    if (activeTopic === "All") return true;
    return (
      c.title.toLowerCase().includes(activeTopic.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(activeTopic.toLowerCase()) ||
      (activeTopic === "Graphic Design" &&
        c.title.toLowerCase().includes("design")) ||
      (activeTopic === "Web Development" &&
        c.title.toLowerCase().includes("web")) ||
      (activeTopic === "AI & Machine Learning" &&
        c.title.toLowerCase().includes("ai")) ||
      (activeTopic === "CopyWriting" && c.course_type === "pdf")
    );
  });

  return (
    <div>
      {/* CATEGORIES BAR */}
      <div className="topics-bar">
        <div className="topics-inner">
          {topicsList.map((topic) => (
            <a
              key={topic}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTopic(topic);
              }}
              className={`topic-link ${activeTopic === topic ? "active" : ""}`}
            >
              {topic}
            </a>
          ))}
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="hero" style={{ position: "relative" }}>
        <div className="hero-slides">
          {heroData.map((slide, idx) => (
            <div
              key={idx}
              className={`hero-slide ${currentSlide === idx ? "active" : ""}`}
              style={{ backgroundImage: `url('${resolveImageSrc(slide.image)}')` }}
            ></div>
          ))}
        </div>

        <div className="hero-mobile-img">
          <img src={resolveImageSrc(heroData[currentSlide].image)} alt="Hero" />
        </div>

        <div className="hero-overlay"></div>
        <div className="wave-bg"></div>

        <div className="hero-container">
          <div className="hero-text">
            <p className="hero-label">{heroData[currentSlide].label}</p>
            <h1>{heroData[currentSlide].title}</h1>
            <p>{heroData[currentSlide].subtitle}</p>
            <div className="hero-actions">
              <Link
                to={heroData[currentSlide].link}
                className="hero-btn"
                style={{ display: "inline-block", textAlign: "center" }}
              >
                {heroData[currentSlide].button}
              </Link>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="hero-dots">
          {heroData.map((_, idx) => (
            <span
              key={idx}
              className={`hero-dot ${currentSlide === idx ? "active" : ""}`}
              onClick={() => setCurrentSlide(idx)}
            ></span>
          ))}
        </div>
      </section>

      {/* FEATURED TOPICS */}
      <section className="topics-section">
        <h2>More Courses Coming Soon!</h2>
        <div className="topics-cards">
          <div
            className="topic-card"
            onClick={() => setActiveTopic("Graphic Design")}
          >
            Graphic Design
          </div>
          <div
            className="topic-card"
            onClick={() => setActiveTopic("Web Development")}
          >
            Web Development
          </div>
          <div
            className="topic-card"
            onClick={() => setActiveTopic("AI & Machine Learning")}
          >
            AI Mastery
          </div>
          <div
            className="topic-card"
            onClick={() => setActiveTopic("Business")}
          >
            Business
          </div>
          <div
            className="topic-card"
            onClick={() => setActiveTopic("CopyWriting")}
          >
            CopyWriting
          </div>
          <div
            className="topic-card"
            onClick={() => setActiveTopic("Personal Development")}
          >
            Personal Development
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="courses-section">
        <h2>Available Courses</h2>
        <p className="section-subtitle">
          Expand your skills with our expert-led courses. More Courses Coming
          soon!
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            Loading available courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#6a6f73" }}
          >
            No courses found matching this category.
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <Link
                to={`/course/${course.id}`}
                key={course.id}
                className="course-link"
              >
                <div className="course-card">
                  <div className="course-image">
                    <img
                      src={resolveImageSrc(course.thumbnail)}
                      alt={course.title}
                    />
                    <div className="course-hover-overlay">
                      <div className="hover-info">
                        <p className="hover-title">{course.title}</p>
                        <p className="hover-desc">
                          {course.preview_text ||
                            "What you'll learn in this course"}
                        </p>
                        <button className="hover-enroll-btn">Enroll Now</button>
                      </div>
                    </div>
                  </div>

                  <div className="course-content">
                    <h3>{course.title}</h3>
                    <p className="instructor">{course.instructor}</p>
                    <div className="course-meta">
                      <span
                        className="rating"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Star
                          size={14}
                          fill="var(--brand-yellow)"
                          color="var(--brand-yellow)"
                        />{" "}
                        4.8
                      </span>
                      <span className="students">1k+ Students Recommend</span>
                    </div>
                    <div className="course-footer">
                      <p className="price">&#8358;{course.price}</p>
                      <span className="badge">Bestseller</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* BECOME INSTRUCTOR BANNER */}
      <section className="instructor-banner">
        <div className="instructor-banner-inner">
          <div className="instructor-text">
            <h2>Become an Instructor</h2>
            <p>
              Share your knowledge and earn by teaching what you love on YVN
              Academy.
            </p>
            <a
              href="https://wa.me/2349017186100?text=Good%20day%20ma'am%2C%20I%20want%20to%20become%20an%20instructor%20in%20YVN%20Academy"
              target="_blank"
              rel="noreferrer"
              className="instructor-cta"
            >
              Start Teaching Today
            </a>
          </div>
          <div className="instructor-img">
            <img src={resolveImageSrc('Instructor.jg.jpg')} alt="Instructor" />
          </div>
        </div>
      </section>
    </div>
  );
}

// 2. ABOUT PAGE
function About() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-hero-inner">
          <p className="about-label">Our Story</p>
          <h1 className="about-title">
            Built to Shape our Generation to be Digitally Ready
          </h1>
          <p className="about-subtitle">
            YVN Academy was founded with one mission — to make world-class skill
            education accessible to every young person in Nigeria and beyond.
          </p>
        </div>
      </div>

      <div className="about-section">
        <div className="about-section-inner">
          <div className="about-text-block">
            <h2>Our Mission</h2>
            <p>
              At Yielded Vessel Network Academy, we believe that God made you
              with a purpose, and to fulfill that purpose you need the skills in
              different ways. Where you are born should not determine how far
              you go. We create and curate high-quality courses in design,
              technology, business, and personal development — taught by real
              practitioners who have done the work.
            </p>
            <p>
              Equipping you to be morally Strong and Digitally Ready. Every
              course on YVN Academy is designed to be practical, affordable, and
              immediately applicable. No fluff. No theory for theory's sake.
              Just skills that move you forward.
            </p>
          </div>
          <div className="about-image-block">
            <div className="about-mission-card">
              <div className="about-stat-item">
                <span className="about-stat-num">500+</span>
                <span className="about-stat-lbl">Students Taught</span>
              </div>
              <div className="about-stat-item">
                <span className="about-stat-num">10+</span>
                <span className="about-stat-lbl">Courses Available</span>
              </div>
              <div className="about-stat-item">
                <span className="about-stat-num">100%</span>
                <span className="about-stat-lbl">Practical Learning</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="about-founder-section">
        <div className="about-section-inner">
          <h2 className="about-section-title">Meet the Founder</h2>
          <div className="about-founder-card">
            <div className="about-founder-img">
              <img src={resolveImageSrc('onyinyechi.jpg')} alt="Founder" />
            </div>
            <div className="about-founder-text">
              <h3>Onyinyechi Annabel Eucharia</h3>
              <p className="about-founder-role">
                Founder & Lead Instructor, Yielded Vessel Network International
              </p>
              <p>
                Hey dear, I'm Onyinyechi Annabel and I wear two hats with pride:
                I'm a teen coach and a fashion enthusiast. Let me share a bit
                about myself and what drives me. As a teen coach, I've been
                through my fair share of struggles, including depression, low
                self-esteem, and anxiety during my teenage years. These
                challenges shaped my perspective, and I'm here to help teens
                navigate their own paths to happiness and self-confidence.
                Together, we can overcome hurdles and embark on a journey
                towards personal growth and well-being.
              </p>
              <a
                href="https://wa.me/2349017186100?text=Good%20day%20ma'am%2C%20I%20want%20to%20learn%20more%20about%20YVN%20Academy"
                target="_blank"
                rel="noreferrer"
                className="about-contact-btn"
              >
                Contact me on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="about-section about-values-section">
        <div className="about-section-inner">
          <h2 className="about-section-title">What We Stand For</h2>
          <div className="about-values-grid">
            <div className="about-value-card">
              <div
                className="about-value-icon"
                style={{
                  color: "var(--brand-green)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Compass size={36} />
              </div>
              <h3>Good Spiritual Foundation</h3>
              <p>
                While being digitally ready, Knowing who you are in Christ is
                essential.
              </p>
            </div>
            <div className="about-value-card">
              <div
                className="about-value-icon"
                style={{
                  color: "var(--brand-green)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Cpu size={36} />
              </div>
              <h3>Practical Learning</h3>
              <p>
                Every lesson is built around real skills you can use immediately
                — not just theory.
              </p>
            </div>
            <div className="about-value-card">
              <div
                className="about-value-icon"
                style={{
                  color: "var(--brand-green)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Users size={36} />
              </div>
              <h3>Community First</h3>
              <p>
                Learning is better together. Our students support, inspire and
                push each other forward.
              </p>
            </div>
            <div className="about-value-card">
              <div
                className="about-value-icon"
                style={{
                  color: "var(--brand-green)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Award size={36} />
              </div>
              <h3>Affordable Access</h3>
              <p>
                World-class education should not cost a fortune. We keep our
                prices fair and accessible.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="about-cta-section">
        <div className="about-cta-inner">
          <h2>Ready to Start Learning?</h2>
          <p>
            Join hundreds of students already building their future with YVN
            Academy.
          </p>
          <div className="about-cta-buttons">
            <Link to="/courses" className="about-cta-primary">
              Browse Courses
            </Link>
            <a
              href="https://wa.me/2349017186100?text=Good%20day%20ma'am%2C%20I%20have%20a%20question"
              target="_blank"
              rel="noreferrer"
              className="about-cta-secondary"
            >
              Talk to Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. COURSES GRID / CATALOG PAGE
function Courses() {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  useEffect(() => {
    let url = "/api/courses";
    if (query) {
      url += `?q=${encodeURIComponent(query)}`;
    }
    apiFetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (category) {
          const filtered = data.filter(
            (c) =>
              c.title.toLowerCase().includes(category.toLowerCase()) ||
              (c.description || "")
                .toLowerCase()
                .includes(category.toLowerCase()) ||
              (category === "CopyWriting" && c.course_type === "pdf"),
          );
          setCourses(filtered);
        } else {
          setCourses(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [query, category]);

  return (
    <div className="container" style={{ padding: "40px 20px" }}>
      <h2>
        {category
          ? `${category} Courses`
          : query
            ? `Search Results for "${query}"`
            : "All Available Courses"}
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
        Expand your skills with our expert-led courses.
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-muted)",
          }}
        >
          No courses found matching your request.
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <Link
              to={`/course/${course.id}`}
              key={course.id}
              className="course-link"
            >
              <div className="course-card">
                <div className="course-image">
                  <img
                    src={resolveImageSrc(course.thumbnail)}
                    alt={course.title}
                  />
                  <div className="course-hover-overlay">
                    <div className="hover-info">
                      <p className="hover-title">{course.title}</p>
                      <p className="hover-desc">
                        {course.preview_text ||
                          "What you'll learn in this course"}
                      </p>
                      <button className="hover-enroll-btn">Enroll Now</button>
                    </div>
                  </div>
                </div>

                <div className="course-content">
                  <h3>{course.title}</h3>
                  <p className="instructor">{course.instructor}</p>
                  <div className="course-meta">
                    <span
                      className="rating"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Star
                        size={14}
                        fill="var(--brand-yellow)"
                        color="var(--brand-yellow)"
                      />{" "}
                      4.8
                    </span>
                    <span className="students">1k+ Students Recommend</span>
                  </div>
                  <div className="course-footer">
                    <p className="price">&#8358;{course.price}</p>
                    <span className="badge">Bestseller</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// 4. COURSE DETAIL PAGE
function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, addFlash } = useAuth();

  const [course, setCourse] = useState(null);
  const [purchased, setPurchased] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [userRating, setUserRating] = useState(null);

  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const fetchCourseDetails = useCallback(() => {
    apiFetch(`/api/courses/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          addFlash(data.error);
          navigate("/");
          return;
        }
        setCourse(data.course);
        setPurchased(data.purchased);
        setWishlisted(data.wishlisted);
        setRatings(data.ratings);
        setAvgRating(data.avg_rating);
        setUserRating(data.user_rating);
        if (data.user_rating) {
          setStars(data.user_rating.stars);
          setReviewText(data.user_rating.review);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [id, addFlash, navigate]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const toggleWishlist = async () => {
    if (!user) {
      addFlash("Please log in to add courses to your wishlist.");
      navigate("/login");
      return;
    }
    const method = wishlisted ? "DELETE" : "POST";
    try {
      const res = await apiFetch(`/api/wishlist/${id}`, { method });
      const data = await res.json();
      if (res.ok) {
        setWishlisted(!wishlisted);
        addFlash(data.message);
      } else {
        addFlash(data.error);
      }
    } catch {
      addFlash("Failed to update wishlist.");
    }  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    setRatingSubmitting(true);
    try {
      const res = await apiFetch(`/api/courses/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, review: reviewText }),
      });
      const data = await res.json();
      if (res.ok) {
        addFlash(data.message);
        fetchCourseDetails();
      } else {
        addFlash(data.error);
      }
    } catch {
      addFlash("Could not save rating.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        Loading course details...
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ padding: "40px 20px", maxWidth: "1000px" }}
    >
      <div
        className="course-detail-container"
        style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}
      >
        {/* Left Side */}
        <div style={{ flex: "1 1 500px" }}>
          <h2>{course.title}</h2>
          <p className="instructor">
            Instructor: <strong>{course.instructor}</strong>
          </p>

          <div
            style={{
              margin: "16px 0",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                color: "#eb8a00",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Star size={18} fill="#eb8a00" color="#eb8a00" /> {avgRating}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "15px" }}>
              ({ratings.length} ratings)
            </span>
          </div>

          <div style={{ margin: "20px 0" }}>
            <img
              src={resolveImageSrc(course.thumbnail)}
              alt={course.title}
              style={{
                width: "100%",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              }}
            />
          </div>

          <h3>Course Description</h3>
          <p
            style={{
              lineHeight: "1.7",
              whiteSpace: "pre-wrap",
              color: "var(--brand-black)",
            }}
          >
            {course.description}
          </p>
        </div>

        {/* Right Side Panel */}
        <div
          style={{
            flex: "1 1 300px",
            backgroundColor: "var(--brand-white)",
            padding: "24px",
            borderRadius: "12px",
            alignSelf: "flex-start",
            border: "1px solid var(--border-gray)",
          }}
        >
          <p
            className="price"
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              margin: "0 0 16px 0",
            }}
          >
            &#8358;{course.price}
          </p>

          <button
            onClick={toggleWishlist}
            className="hero-btn"
            style={{
              width: "100%",
              marginBottom: "12px",
              backgroundColor: wishlisted ? "#ef4444" : "var(--brand-green)",
              border: "none",
              padding: "12px",
              color: "white",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Heart size={18} fill={wishlisted ? "white" : "none"} />{" "}
            {wishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
          </button>

          {purchased ? (
            <div>
              {purchased.status === "approved" ? (
                <div>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#ecfdf5",
                      color: "#065f46",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      textAlign: "center",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <CheckCircle size={16} /> Enrollment Approved!
                  </div>
                  <Link
                    to={`/course/${course.id}/content`}
                    className="hero-btn"
                    style={{
                      display: "block",
                      textAlign: "center",
                      backgroundColor: "var(--brand-green)",
                    }}
                  >
                    Go to Course Content
                  </Link>
                </div>
              ) : purchased.status === "pending" ? (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fffbeb",
                    color: "#92400e",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Info size={16} /> Access Pending (Reviewing Receipt)
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#fef2f2",
                      color: "#991b1b",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <AlertTriangle size={16} /> Rejected:{" "}
                    {purchased.status.replace("rejected: ", "")}
                  </div>
                  <Link
                    to={`/course/${course.id}/buy`}
                    className="hero-btn"
                    style={{ display: "block", textAlign: "center" }}
                  >
                    Re-submit Receipt
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                if (!user) {
                  addFlash("Please log in to purchase courses.");
                  navigate("/login");
                } else {
                  navigate(`/course/${course.id}/buy`);
                }
              }}
              className="hero-btn"
              style={{ width: "100%", display: "block", textAlign: "center" }}
            >
              Buy Now
            </button>
          )}
        </div>
      </div>

      <hr
        style={{
          margin: "40px 0",
          border: "none",
          borderTop: "1px solid var(--border-gray)",
        }}
      />

      {/* Review Submission */}
      {purchased && purchased.status === "approved" && (
        <div
          style={{
            backgroundColor: "var(--brand-white)",
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "40px",
            border: "1px solid var(--border-gray)",
          }}
        >
          <h3>{userRating ? "Update Your Rating" : "Rate This Course"}</h3>
          <form onSubmit={handleRateSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Stars:
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  fontSize: "24px",
                  cursor: "pointer",
                  margin: "8px 0",
                }}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    fill={s <= stars ? "var(--brand-yellow)" : "none"}
                    color="var(--brand-yellow)"
                    onClick={() => setStars(s)}
                    size={28}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Review Text:
              </label>
              <textarea
                rows="4"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-gray)",
                }}
                placeholder="Share your thoughts about this course..."
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={ratingSubmitting}
              style={{
                backgroundColor: "var(--brand-green)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {ratingSubmitting ? "Saving..." : "Submit Rating"}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <h3>Student Reviews ({ratings.length})</h3>
        {ratings.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No reviews yet. Be the first to leave a rating!
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {ratings.map((rating) => (
              <div
                key={rating.id}
                style={{
                  borderBottom: "1px solid var(--border-gray)",
                  paddingBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <strong>{rating.name}</strong>
                  <span
                    style={{ color: "var(--text-muted)", fontSize: "13px" }}
                  >
                    {rating.date}
                  </span>
                </div>
                <div
                  style={{ display: "flex", gap: "2px", marginBottom: "8px" }}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      fill={s <= rating.stars ? "var(--brand-yellow)" : "none"}
                      color="var(--brand-yellow)"
                      size={16}
                    />
                  ))}
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--brand-black)",
                    lineHeight: "1.5",
                  }}
                >
                  {rating.review}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 5. BUY COURSE PAGE
function BuyCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addFlash } = useAuth();

  const [course, setCourse] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/courses/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data.course);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [id, addFlash, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receipt) {
      addFlash("Please select a receipt image file.");
      return;
    }
    setSubmitting(true);

    const formData = new FormData();
    formData.append("receipt", receipt);

    try {
      const res = await apiFetch(`/api/courses/${id}/buy`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        addFlash(data.message);
        navigate("/dashboard");
      } else {
        addFlash(data.error);
      }
    } catch {
      addFlash("Network error. Failed to submit receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>Loading...</div>
    );

  return (
    <div
      className="container"
      style={{ padding: "40px 20px", maxWidth: "600px" }}
    >
      <h2>Buy {course?.title}</h2>

      <div
        style={{
          backgroundColor: "var(--brand-white)",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid var(--border-gray)",
          margin: "20px 0",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Landmark size={20} color="var(--brand-green)" /> Bank Transfer
          Details
        </h3>
        <p>
          <strong>Bank:</strong> OPAY
        </p>
        <p>
          <strong>Account Name:</strong> Nwanga Onyinye Eucharia
        </p>
        <p>
          <strong>Account Number:</strong> 9017186100
        </p>
      </div>

      <p style={{ color: "var(--text-muted)" }}>
        After making the bank transfer, please upload your receipt image below.
      </p>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div style={{ margin: "20px 0" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Upload Receipt:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceipt(e.target.files[0])}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px dashed var(--border-gray)",
              borderRadius: "6px",
            }}
          />
        </div>
        <button
          type="submit"
          className="hero-btn"
          disabled={submitting}
          style={{ width: "100%", display: "block", textAlign: "center" }}
        >
          {submitting ? "Submitting Receipt..." : "Submit Receipt"}
        </button>
      </form>
    </div>
  );
}

// 6. COURSE CONTENT PAGE
function CourseContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addFlash } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/courses/${id}/content`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          addFlash(data.error);
          navigate("/dashboard");
          return;
        }
        setCourse(data.course);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [id, addFlash, navigate]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        Checking access...
      </div>
    );

  return (
    <div
      className="container"
      style={{ padding: "40px 20px", maxWidth: "800px" }}
    >
      <h2>{course.title} Content</h2>
      <p className="instructor">
        Instructor: <strong>{course.instructor}</strong>
      </p>

      {course.course_type === "pdf" ? (
        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              width: "100%",
              height: "600px",
              border: "1px solid var(--border-gray)",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "20px",
            }}
          >
            <iframe
              src={apiUrl(`/api/courses/${id}/pdf`)}
              width="100%"
              height="100%"
              style={{ border: "none" }}
              title="PDF Course Content"
            ></iframe>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <a
              href={apiUrl(`/api/courses/${id}/download`)}
              download
              className="hero-btn"
              style={{
                display: "inline-block",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Download PDF
            </a>
            <Link
              to={`/course/${id}`}
              className="hero-btn"
              style={{
                display: "inline-block",
                textAlign: "center",
                textDecoration: "none",
                backgroundColor: "#6c757d",
              }}
            >
              Back to Details
            </Link>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "var(--brand-white)",
            padding: "40px",
            borderRadius: "12px",
            border: "1px solid var(--border-gray)",
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Video size={24} color="var(--brand-green)" /> Telegram Course
            Access
          </h3>
          <p style={{ margin: "16px 0 24px 0", color: "var(--text-muted)" }}>
            This course is hosted inside a private Telegram channel. Click the
            button below to join.
          </p>
          <a
            href={course.telegram_link}
            target="_blank"
            rel="noreferrer"
            className="hero-btn"
            style={{
              display: "inline-block",
              textDecoration: "none",
              padding: "14px 28px",
            }}
          >
            Join Telegram Channel
          </a>
        </div>
      )}
    </div>
  );
}

// 7. UNIFIED DASHBOARD FOR ADMINS & STUDENTS
function Dashboard() {
  const { user, addFlash } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab") || "overview";

  // Student states
  const [studentCourses, setStudentCourses] = useState([]);
  const [wishlistCourses, setWishlistCourses] = useState([]);

  // Admin states
  const [studentsList, setStudentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [purchasesList, setPurchasesList] = useState([]);

  const [loading, setLoading] = useState(true);

  // Admin reject details
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      if (user.isAdmin) {
        const [stRes, coRes, puRes] = await Promise.all([
          apiFetch("/api/admin/students").then((r) => r.json()),
          apiFetch("/api/admin/courses").then((r) => r.json()),
          apiFetch("/api/admin/purchases").then((r) => r.json()),
        ]);
        setStudentsList(stRes);
        setCoursesList(coRes);
        setPurchasesList(puRes);
      } else {
        const [myRes, wiRes] = await Promise.all([
          apiFetch("/api/dashboard").then((r) => r.json()),
          apiFetch("/api/wishlist").then((r) => r.json()),
        ]);
        setStudentCourses(myRes);
        setWishlistCourses(wiRes);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        if (user.isAdmin) {
          const [stRes, coRes, puRes] = await Promise.all([
            apiFetch("/api/admin/students").then((r) => r.json()),
            apiFetch("/api/admin/courses").then((r) => r.json()),
            apiFetch("/api/admin/purchases").then((r) => r.json()),
          ]);
          if (cancelled) return;
          setStudentsList(stRes);
          setCoursesList(coRes);
          setPurchasesList(puRes);
        } else {
          const [myRes, wiRes] = await Promise.all([
            apiFetch("/api/dashboard").then((r) => r.json()),
            apiFetch("/api/wishlist").then((r) => r.json()),
          ]);
          if (cancelled) return;
          setStudentCourses(myRes);
          setWishlistCourses(wiRes);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitialData();
    return () => {
      cancelled = true;
    };
  }, [user, tabParam]);

  // Admin Actions
  const handleApprove = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/purchases/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        addFlash(data.message);
        loadData();
      }
    } catch {
      addFlash("Failed to approve purchase.");
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/admin/purchases/${rejectId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (res.ok) {
        addFlash(data.message);
        setRejectId(null);
        setRejectReason("");
        loadData();
      }
    } catch {
      addFlash("Failed to reject purchase.");
    }
  };

  const handleToggleCourse = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/courses/${id}/toggle`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        addFlash(data.message);
        loadData();
      }
    } catch {
      addFlash("Failed to toggle course visibility.");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this course? Student logs will be cleared!",
      )
    )
      return;
    try {
      const res = await apiFetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        addFlash(data.message);
        loadData();
      }
    } catch {
      addFlash("Failed to delete course.");
    }
  };

  const handleRemoveWishlist = async (courseId) => {
    try {
      const res = await apiFetch(`/api/wishlist/${courseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        addFlash("Course removed from wishlist.");
        loadData();
      }
    } catch {
      addFlash("Failed to update wishlist.");
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        Loading Dashboard Deck...
      </div>
    );

  // Render Admin Dashboard
  if (user.isAdmin) {
    const pendingPurchases = purchasesList.filter(
      (p) => p.status === "pending",
    );
    const totalRevenue = purchasesList
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

    return (
      <div className="admin-page">
        <header className="admin-header">
          <div className="admin-header-inner">
            <div>
              <p className="admin-label">Admin Dashboard</p>
              <h1
                className="admin-title"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: 0,
                }}
              >
                <LayoutDashboard size={30} /> Instructor Console
              </h1>
              <p className="admin-sub" style={{ marginTop: "8px" }}>
                Welcome back, {user.username}. Review payments, publish courses,
                and manage students from one place.
              </p>
            </div>
            <Link
              to="/admin/add-course"
              className="admin-action-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <PlusCircle size={16} /> Publish Course
            </Link>
          </div>
        </header>

        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div>
                <span className="admin-stat-lbl">Total Students</span>
                <div
                  className="admin-stat-num"
                  style={{ color: "var(--brand-black)", marginTop: "8px" }}
                >
                  {studentsList.length}
                </div>
              </div>
              <Users
                size={36}
                color="var(--brand-green)"
                style={{ opacity: 0.8 }}
              />
            </div>
          </div>
          <div className="admin-stat-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div>
                <span className="admin-stat-lbl">Published Courses</span>
                <div
                  className="admin-stat-num"
                  style={{ color: "var(--brand-black)", marginTop: "8px" }}
                >
                  {coursesList.length}
                </div>
              </div>
              <BookOpenText
                size={36}
                color="var(--brand-green)"
                style={{ opacity: 0.8 }}
              />
            </div>
          </div>
          <div className="admin-stat-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div>
                <span className="admin-stat-lbl">Pending Reviews</span>
                <div
                  className="admin-stat-num"
                  style={{ color: "var(--brand-black)", marginTop: "8px" }}
                >
                  {pendingPurchases.length}
                </div>
              </div>
              <AlertTriangle
                size={36}
                color={
                  pendingPurchases.length > 0 ? "#d97706" : "var(--brand-green)"
                }
                style={{ opacity: 0.8 }}
              />
            </div>
          </div>
          <div className="admin-stat-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div>
                <span className="admin-stat-lbl">Total Earnings</span>
                <div
                  className="admin-stat-num"
                  style={{ color: "var(--brand-black)", marginTop: "8px" }}
                >
                  &#8358;{totalRevenue.toLocaleString()}
                </div>
              </div>
              <TrendingUp
                size={36}
                color="var(--brand-green)"
                style={{ opacity: 0.8 }}
              />
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          {/* Tab Controls */}
          <div className="admin-tabs">
            <button
              onClick={() => setSearchParams({ tab: "overview" })}
              className={`admin-tab-btn ${tabParam === "overview" ? "active" : ""}`}
            >
              Overview
            </button>
            <button
              onClick={() => setSearchParams({ tab: "purchases" })}
              className={`admin-tab-btn ${tabParam === "purchases" ? "active" : ""}`}
            >
              Purchases{" "}
              {pendingPurchases.length > 0 && (
                <span
                  className="dash-status-badge badge-pending"
                  style={{ marginLeft: "6px" }}
                >
                  {pendingPurchases.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSearchParams({ tab: "courses" })}
              className={`admin-tab-btn ${tabParam === "courses" ? "active" : ""}`}
            >
              Courses Inventory
            </button>
            <button
              onClick={() => setSearchParams({ tab: "students" })}
              className={`admin-tab-btn ${tabParam === "students" ? "active" : ""}`}
            >
              Students Directory
            </button>
          </div>

          {/* 1. OVERVIEW TAB */}
          {tabParam === "overview" && (
            <div>
              <div className="surface-card">
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <ShoppingBag size={20} color="var(--brand-green)" /> Recent
                  Pending Verifications
                </h3>
                {pendingPurchases.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>
                    All purchase requests have been reviewed! Good job.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {pendingPurchases.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid var(--border-gray)",
                          paddingBottom: "12px",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <strong>{p.email}</strong> wants to buy{" "}
                          <strong>{p.title}</strong>
                        </div>
                        <button
                          onClick={() => setSearchParams({ tab: "purchases" })}
                          className="dash-browse-btn"
                          style={{ border: "none" }}
                        >
                          Review Payment <ChevronRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. PURCHASES TAB */}
          {tabParam === "purchases" && (
            <div>
              {rejectId && (
                <div
                  className="surface-card"
                  style={{ borderColor: "#dc3545", marginBottom: "24px" }}
                >
                  <h3
                    style={{
                      marginTop: 0,
                      color: "#dc3545",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <X size={20} /> Reject Payment Request #{rejectId}
                  </h3>
                  <form onSubmit={handleRejectSubmit}>
                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "6px",
                          fontWeight: "bold",
                        }}
                      >
                        Reason for rejection:
                      </label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-gray)",
                        }}
                        placeholder="e.g. Incomplete transfer, blur image, wrong invoice receipt"
                      />
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="submit"
                        className="hero-btn"
                        style={{ backgroundColor: "#dc3545" }}
                      >
                        Reject Payment
                      </button>
                      <button
                        type="button"
                        className="hero-btn"
                        style={{ backgroundColor: "#6c757d" }}
                        onClick={() => setRejectId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ padding: "12px 16px" }}>ID</th>
                      <th style={{ padding: "12px 16px" }}>Student Email</th>
                      <th style={{ padding: "12px 16px" }}>Course Title</th>
                      <th style={{ padding: "12px 16px" }}>Receipt Image</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                      <th style={{ padding: "12px 16px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchasesList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          No purchases found.
                        </td>
                      </tr>
                    ) : (
                      purchasesList.map((p) => (
                        <tr key={p.id} className="admin-table-row">
                          <td style={{ padding: "12px 16px" }}>{p.id}</td>
                          <td style={{ padding: "12px 16px" }}>{p.email}</td>
                          <td style={{ padding: "12px 16px" }}>{p.title}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <a
                              href={resolveReceiptSrc(p.receipt)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "var(--brand-green)",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Eye size={14} /> View Receipt
                            </a>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                fontWeight: "bold",
                                color:
                                  p.status === "approved"
                                    ? "#10b981"
                                    : p.status === "pending"
                                      ? "#d97706"
                                      : "#ef4444",
                              }}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              display: "flex",
                              gap: "8px",
                            }}
                          >
                            {p.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(p.id)}
                                  style={{
                                    backgroundColor: "#10b981",
                                    color: "white",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Check size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectId(p.id)}
                                  style={{
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <X size={14} /> Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. COURSES INVENTORY TAB */}
          {tabParam === "courses" && (
            <div>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ padding: "12px 16px" }}>Thumbnail</th>
                      <th style={{ padding: "12px 16px" }}>Title</th>
                      <th style={{ padding: "12px 16px" }}>Instructor</th>
                      <th style={{ padding: "12px 16px" }}>Price</th>
                      <th style={{ padding: "12px 16px" }}>Delivery Type</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                      <th style={{ padding: "12px 16px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coursesList.map((c) => (
                      <tr key={c.id} className="admin-table-row">
                        <td style={{ padding: "12px 16px" }}>
                          <img
                            src={resolveImageSrc(c.thumbnail)}
                            alt={c.title}
                            style={{ width: "60px", borderRadius: "4px" }}
                          />
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "600" }}>
                          {c.title}
                        </td>
                        <td style={{ padding: "12px 16px" }}>{c.instructor}</td>
                        <td style={{ padding: "12px 16px" }}>
                          &#8358;{c.price}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {c.course_type === "pdf" ? (
                              <FileText size={14} />
                            ) : (
                              <Video size={14} />
                            )}
                            {c.course_type?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontWeight: "bold",
                              color: c.is_active ? "#10b981" : "#ef4444",
                            }}
                          >
                            {c.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            display: "flex",
                            gap: "8px",
                            alignContent: "center",
                          }}
                        >
                          <Link
                            to={`/admin/courses/edit/${c.id}`}
                            style={{
                              backgroundColor: "var(--brand-green)",
                              color: "white",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleToggleCourse(c.id)}
                            style={{
                              backgroundColor: "#6b7280",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            Toggle Status
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(c.id)}
                            style={{
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. STUDENTS DIRECTORY TAB */}
          {tabParam === "students" && (
            <div>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ padding: "12px 16px" }}>ID</th>
                      <th style={{ padding: "12px 16px" }}>Name</th>
                      <th style={{ padding: "12px 16px" }}>Email</th>
                      <th style={{ padding: "12px 16px" }}>Total Purchases</th>
                      <th style={{ padding: "12px 16px" }}>Approved Courses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((s) => (
                      <tr key={s.id} className="admin-table-row">
                        <td style={{ padding: "12px 16px" }}>{s.id}</td>
                        <td
                          style={{ padding: "12px 16px", fontWeight: "bold" }}
                        >
                          {s.name}
                        </td>
                        <td style={{ padding: "12px 16px" }}>{s.email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {s.total_purchases}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {s.approved_courses}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Student Dashboard
  return (
    <div className="dashboard-page">
      <section className="dash-welcome">
        <div className="dash-welcome-inner">
          <div className="dash-welcome-text">
            <p className="dash-greeting">Student Dashboard</p>
            <h1 className="dash-name">Welcome back, {user.username}</h1>
            <p className="dash-sub">{user.email}</p>
          </div>
          <div className="dash-welcome-stat-group">
            <div className="dash-stat">
              <span className="dash-stat-number">{studentCourses.length}</span>
              <span className="dash-stat-label">Courses</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat-number">
                {
                  studentCourses.filter(
                    (purchase) => purchase.status === "approved",
                  ).length
                }
              </span>
              <span className="dash-stat-label">Approved</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat-number">{wishlistCourses.length}</span>
              <span className="dash-stat-label">Wishlist</span>
            </div>
          </div>
        </div>
      </section>

      <div className="dash-content">
        <div className="dash-quick-nav">
          <button
            onClick={() => setSearchParams({ tab: "courses" })}
            className={`dash-quick-link ${tabParam === "courses" || tabParam === "overview" ? "active" : ""}`}
          >
            My Enrolled Courses
          </button>
          <button
            onClick={() => setSearchParams({ tab: "wishlist" })}
            className={`dash-quick-link ${tabParam === "wishlist" ? "active" : ""}`}
          >
            My Wishlist
          </button>
        </div>

        <div className="dash-section-header" style={{ marginTop: "28px" }}>
          <div>
            <h2 style={{ marginBottom: "4px" }}>Your Learning Space</h2>
            <p
              style={{
                margin: 0,
                color: "var(--text-muted)",
                fontSize: "14px",
              }}
            >
              Track progress, open your content, and keep your saved courses in
              one place.
            </p>
          </div>
          <Link to="/courses" className="dash-browse-btn">
            Browse more courses
          </Link>
        </div>

        {/* My Courses Tab */}
        {(tabParam === "courses" || tabParam === "overview") && (
          <div>
            {studentCourses.length === 0 ? (
              <div className="dash-empty">
                <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0" }}>
                  You have not enrolled in any courses yet.
                </p>
                <Link
                  to="/courses"
                  className="dash-browse-btn"
                  style={{ textDecoration: "none" }}
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="dash-courses-grid">
                {studentCourses.map((purchase) => (
                  <div
                    key={purchase.id}
                    className={`dash-course-card ${purchase.status === "approved" ? "dash-card-active" : purchase.status === "pending" ? "dash-card-pending" : ""}`}
                  >
                    <div className="dash-card-top">
                      <div
                        className="dash-card-icon"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {purchase.course_type === "pdf" ? (
                          <FileText size={14} />
                        ) : (
                          <Video size={14} />
                        )}
                        {purchase.course_type?.toUpperCase() || "COURSE"}
                      </div>
                      <span
                        className={`dash-status-badge ${purchase.status === "approved" ? "badge-active" : "badge-pending"}`}
                      >
                        {purchase.status === "approved"
                          ? "Approved"
                          : purchase.status === "pending"
                            ? "Pending"
                            : "Rejected"}
                      </span>
                    </div>

                    <h3 className="dash-card-title">{purchase.title}</h3>
                    <p className="dash-card-sub">
                      Delivery:{" "}
                      {purchase.course_type?.toUpperCase() || "Course"}.
                    </p>

                    <div className="dash-card-progress">
                      {purchase.status === "approved" ? (
                        <Link
                          to={`/course/${purchase.id}/content`}
                          className="dash-start-btn"
                          style={{ textDecoration: "none" }}
                        >
                          Study Course <ChevronRight size={16} />
                        </Link>
                      ) : purchase.status === "pending" ? (
                        <div className="dash-pending-info">
                          <Info size={16} /> Verification in progress. We are
                          reviewing your receipt.
                        </div>
                      ) : (
                        <div className="dash-rejected-info">
                          <div
                            className="dash-rejected-reason"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginBottom: "10px",
                            }}
                          >
                            <AlertTriangle size={16} /> Rejected (
                            {purchase.status.replace("rejected: ", "")})
                          </div>
                          <Link
                            to={`/course/${purchase.id}/buy`}
                            className="dash-resubmit-btn"
                            style={{
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            Resubmit Payment <ChevronRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {tabParam === "wishlist" && (
          <div>
            {wishlistCourses.length === 0 ? (
              <div className="dash-empty">
                <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0" }}>
                  Your wishlist is empty.
                </p>
                <Link
                  to="/courses"
                  className="dash-browse-btn"
                  style={{ textDecoration: "none" }}
                >
                  Explore Courses
                </Link>
              </div>
            ) : (
              <div className="courses-grid">
                {wishlistCourses.map((course) => (
                  <div key={course.id} style={{ position: "relative" }}>
                    <Link to={`/course/${course.id}`} className="course-link">
                      <div className="course-card">
                        <div className="course-image">
                          <img
                            src={resolveImageSrc(course.thumbnail)}
                            alt={course.title}
                          />
                        </div>
                        <div className="course-content">
                          <h3>{course.title}</h3>
                          <p className="instructor">{course.instructor}</p>
                          <p className="price" style={{ fontWeight: "bold" }}>
                            &#8358;{course.price}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleRemoveWishlist(course.id)}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        backgroundColor: "rgba(239, 68, 68, 0.9)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "16px",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Remove from Wishlist"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 8. LOGIN PAGE
function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-illustration">
        <img
          src={resolveImageSrc('Login illustration.png')}
          alt="Login illustration"
        />
      </div>
      <div className="auth-form-area">
        <div className="auth-form">
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <ShieldAlert size={24} color="var(--brand-green)" /> Welcome back
          </h2>
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                color: "#991b1b",
                padding: "12px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
              />
            </div>
            <div className="form-group password-field">
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              type="submit"
              className="hero-btn"
              disabled={submitting}
              style={{ width: "100%", display: "block", textAlign: "center" }}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="auth-link">
            Don&apos;t have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// 9. REGISTER PAGE
function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await register(username, email, password);
    setSubmitting(false);
    if (res.success) {
      navigate("/login");
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-illustration">
        <img
          src={resolveImageSrc('Login illustration.png')}
          alt="Register illustration"
        />
      </div>
      <div className="auth-form-area">
        <div className="auth-form">
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <UserCheck size={24} color="var(--brand-green)" /> Create an account
          </h2>
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                color: "#991b1b",
                padding: "12px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="yourname"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
              />
            </div>
            <div className="form-group password-field">
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              type="submit"
              className="hero-btn"
              disabled={submitting}
              style={{ width: "100%", display: "block", textAlign: "center" }}
            >
              {submitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>
          <p className="auth-link">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// 10. ADMIN ADD COURSE
function AdminAddCourse() {
  const { addFlash } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [courseType, setCourseType] = useState("video");
  const [telegramLink, setTelegramLink] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("instructor", instructor);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("course_type", courseType);
    formData.append("telegram_link", telegramLink);
    formData.append("preview_text", previewText);
    if (thumbnail) formData.append("thumbnail", thumbnail);
    if (pdfFile && courseType === "pdf") formData.append("pdf_file", pdfFile);

    try {
      const res = await apiFetch("/api/admin/courses", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        addFlash(data.message);
        navigate("/dashboard?tab=courses");
      } else {
        addFlash(data.error);
      }
    } catch {
      addFlash("Failed to create course.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-course-wrap">
      <div className="add-course-card">
        <div style={{ marginBottom: "24px" }}>
          <p className="admin-label" style={{ color: "var(--brand-green)" }}>
            Course Builder
          </p>
          <h2 style={{ margin: "0 0 8px 0" }}>Publish a Course</h2>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Create a course with the same clean structure students will see in
            the catalog.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="add-course-form"
        >
          <div className="form-row">
            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Instructor</label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Short Preview Info</label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="e.g. Learn Branding, Flyers and Typography like a Pro"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (NGN)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 5000"
                required
              />
            </div>
            <div className="form-group">
              <label>Course Content Delivery Type</label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="form-select"
              >
                <option value="video">
                  Telegram Group Link (Videos/Interactives)
                </option>
                <option value="pdf">Direct PDF E-Book Download</option>
              </select>
            </div>
          </div>

          <div className="course-type-toggle">
            <label
              className={`type-option ${courseType === "video" ? "active" : ""}`}
            >
              <input
                type="radio"
                checked={courseType === "video"}
                onChange={() => setCourseType("video")}
              />
              <div className="type-icon">
                <Video size={22} />
              </div>
              <div className="type-text">
                <strong>Telegram Access</strong>
                <small>Videos and interactive delivery</small>
              </div>
            </label>
            <label
              className={`type-option ${courseType === "pdf" ? "active" : ""}`}
            >
              <input
                type="radio"
                checked={courseType === "pdf"}
                onChange={() => setCourseType("pdf")}
              />
              <div className="type-icon">
                <FileText size={22} />
              </div>
              <div className="type-text">
                <strong>PDF Delivery</strong>
                <small>Direct e-book download content</small>
              </div>
            </label>
          </div>

          {courseType === "video" ? (
            <div className="form-group">
              <label>Telegram Private Link</label>
              <input
                type="url"
                value={telegramLink}
                onChange={(e) => setTelegramLink(e.target.value)}
                placeholder="https://t.me/joinchat/..."
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Upload PDF File</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Thumbnail Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
              required
            />
          </div>

          <button
            type="submit"
            className="add-course-submit"
            disabled={submitting}
          >
            {submitting ? "Publishing..." : "Publish Course"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 11. ADMIN EDIT COURSE
function AdminEditCourse() {
  const { id } = useParams();
  const { addFlash } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [courseType, setCourseType] = useState("video");
  const [telegramLink, setTelegramLink] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [isActive, setIsActive] = useState("1");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch(`/api/courses/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const c = data.course;
        setTitle(c.title);
        setInstructor(c.instructor);
        setDescription(c.description);
        setPrice(c.price);
        setCourseType(c.course_type);
        setTelegramLink(c.telegram_link || "");
        setPreviewText(c.preview_text || "");
        setIsActive(String(c.is_active));
        setLoading(false);
      })
      .catch((error) => console.error(error));
  }, [id, addFlash, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("instructor", instructor);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("course_type", courseType);
    formData.append("telegram_link", telegramLink);
    formData.append("preview_text", previewText);
    formData.append("is_active", isActive);
    if (thumbnail) formData.append("thumbnail", thumbnail);
    if (pdfFile && courseType === "pdf") formData.append("pdf_file", pdfFile);

    try {
      const res = await apiFetch(`/api/admin/courses/${id}`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        addFlash(data.message);
        navigate("/dashboard?tab=courses");
      } else {
        addFlash(data.error);
      }
    } catch {
      addFlash("Failed to update course.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        Loading course data...
      </div>
    );

  return (
    <div className="add-course-wrap">
      <div className="add-course-card">
        <div style={{ marginBottom: "24px" }}>
          <p className="admin-label" style={{ color: "var(--brand-green)" }}>
            Course Builder
          </p>
          <h2 style={{ margin: "0 0 8px 0" }}>Edit Course Details</h2>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Keep the structure intact and make targeted changes without
            disturbing the student experience.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="add-course-form"
        >
          <div className="form-row">
            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Instructor</label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Short Preview Info</label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (NGN)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Course Status</label>
              <select
                value={isActive}
                onChange={(e) => setIsActive(e.target.value)}
                className="form-select"
              >
                <option value="1">Active (Visible to Students)</option>
                <option value="0">Inactive (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="course-type-toggle">
            <label
              className={`type-option ${courseType === "video" ? "active" : ""}`}
            >
              <input
                type="radio"
                checked={courseType === "video"}
                onChange={() => setCourseType("video")}
              />
              <div className="type-icon">
                <Video size={22} />
              </div>
              <div className="type-text">
                <strong>Telegram Access</strong>
                <small>Videos and interactive delivery</small>
              </div>
            </label>
            <label
              className={`type-option ${courseType === "pdf" ? "active" : ""}`}
            >
              <input
                type="radio"
                checked={courseType === "pdf"}
                onChange={() => setCourseType("pdf")}
              />
              <div className="type-icon">
                <FileText size={22} />
              </div>
              <div className="type-text">
                <strong>PDF Delivery</strong>
                <small>Direct e-book download content</small>
              </div>
            </label>
          </div>

          {courseType === "video" ? (
            <div className="form-group">
              <label>Telegram Private Link</label>
              <input
                type="url"
                value={telegramLink}
                onChange={(e) => setTelegramLink(e.target.value)}
                placeholder="https://t.me/joinchat/..."
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Upload New PDF File (Optional)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
              />
            </div>
          )}

          <div className="form-group">
            <label>Update Thumbnail Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
            />
          </div>

          <button
            type="submit"
            className="add-course-submit"
            disabled={submitting}
          >
            {submitting ? "Updating Course details..." : "Update Course"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==============================================================
// ROOT APP
// ==============================================================
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="courses" element={<Courses />} />
            <Route path="course/:id" element={<CourseDetail />} />

            {/* Protected Routes */}
            <Route
              path="course/:id/buy"
              element={
                <ProtectedRoute>
                  <BuyCourse />
                </ProtectedRoute>
              }
            />
            <Route
              path="course/:id/content"
              element={
                <ProtectedRoute>
                  <CourseContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="wishlist"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard?tab=wishlist" replace />
                </ProtectedRoute>
              }
            />

            {/* Auth Pages */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            {/* Admin Routes (Forms) */}
            <Route
              path="admin/add-course"
              element={
                <AdminRoute>
                  <AdminAddCourse />
                </AdminRoute>
              }
            />
            <Route
              path="admin/courses/edit/:id"
              element={
                <AdminRoute>
                  <AdminEditCourse />
                </AdminRoute>
              }
            />
            {/* Redirect legacy individual links to Dashboard's tab routes */}
            <Route
              path="admin/purchases"
              element={<Navigate to="/dashboard?tab=purchases" replace />}
            />
            <Route
              path="admin/courses"
              element={<Navigate to="/dashboard?tab=courses" replace />}
            />
            <Route
              path="admin/students"
              element={<Navigate to="/dashboard?tab=students" replace />}
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
