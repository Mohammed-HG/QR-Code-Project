import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../css style/HomePage.css"; // اسم الملف تغير أيضًا

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Welcome to QR Code Generator Project",
    description: "",
    image: "/images/link-to-qr.png",
  },
  {
    title: "إنشاء QR من صورة",
    description: "ارفع صورة وسيتم تحويلها إلى رمز QR بشكل تلقائي.",
    image: "/images/image-to-qr.png",
  },
  {
    title: "سهل الاستخدام",
    description: "واجهة بسيطة وسلسة، بدون الحاجة لتسجيل الدخول.",
    image: "/images/easy-ui.png",
  },
  {
    title: "مجاني 100%",
    description: "استخدم الموقع بدون أي تكاليف أو اشتراكات.",
    image: "/images/free.png",
  },
];

const HomePage = () => {
  const sectionRefs = useRef([]);

  useEffect(() => {
    sectionRefs.current.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, []);

  return (
    <div className="features-container">
      {features.map((feature, idx) => (
        <div
          key={idx}
          ref={(el) => el && (sectionRefs.current[idx] = el)}
          className={`feature-section section-${idx}`}
        > 

          <img src={feature.image} alt={feature.title} className="feature-image" />
          <div className="feature-text">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomePage;
 