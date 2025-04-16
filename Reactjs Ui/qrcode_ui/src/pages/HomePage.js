import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import "../css style/HomePage.css";

import QRCodeAnimation from "../animations/QRCode.json";
import LinkQR from "../animations/Link-qr.json";
import ImageQR from "../animations/Image-qr.json";
import Customize from "../animations/Customize.json";
import Locker from "../animations/Locker.json";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Welcome to QR Code Generator Project",
    description: "Create and customize your QR Code",
    animation: QRCodeAnimation,
  },
  {
    title: "Create by Link",
    description: "Put link and generate QR code",
    animation: LinkQR,
  },
  {
    title: "Create by Image",
    description: "Upload an image to generate a QR code.",
    animation: ImageQR,
  },
  {
    title: "Customize it!",
    description: "Change color, size and more to your QR Code.",
    animation: Customize,
  },
  {
    title: "Save Your QR Code!",
    description: "Save it securely in your account and retrieve anytime.",
    animation: Locker,
  },
  {
    title: "Try it now!",
    description: (
      <Link to="/GRCode_Generator">
        <button className="cta-button">Generate QR Code</button>
      </Link>
    ),
    animation: null,
  },
];

const HomePage = () => {
  const sectionRefs = useRef([]);

  useEffect(() => {
    sectionRefs.current.forEach((el) => {
      const content = el.querySelector(".feature-content");
      if (content) {
        gsap.fromTo(
          content,
          { opacity: 0, y: 200 },
          {
            opacity: 1,
            y: 0,
            duration: 1.5,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    });
  }, []);

  return (
    <div className="features-container">
      {features.map((feature, idx) => (
    <div
      key={idx}
      ref={(el) => el && (sectionRefs.current[idx] = el)}
      className={`feature-section section-${idx}`}
      style={{ backgroundColor: feature.bgColor }}
    >
      {/* خلفية الأنيميشن */}
      {feature.animation && (
        <div className="background-animation">
          <Lottie animationData={feature.animation} loop={true} />
        </div>
      )}
    
      {/* محتوى القسم */}
      <div className="feature-content">
        <div className="feature-image">
          <Lottie animationData={feature.animation} loop={true} />
        </div>
        <div className="feature-text">
          <h2>{feature.title}</h2>
          <p>{feature.description}</p>
        </div>
      </div>
    </div>
    
      ))}
    </div>
  );
};

export default HomePage;
