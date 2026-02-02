import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    company: [
      { name: "About Us", path: "/about" },
      { name: "How It Works", path: "/how-it-works" },
      { name: "Contact Us", path: "/contact" },
      { name: "Careers", path: "/careers" },
    ],
    legal: [
      { name: "Terms & Conditions", path: "/terms" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Refund Policy", path: "/refund" },
      { name: "Cookie Policy", path: "/cookies" },
    ],
    help: [
      { name: "FAQ", path: "/faq" },
      { name: "Missing Cashback", path: "/missing-cashback" },
      { name: "Check Balance", path: "/check-balance" },
      { name: "Withdrawal", path: "/withdrawal" },
    ],
    categories: [
      { name: "Fashion", path: "/category/fashion" },
      { name: "Electronics", path: "/category/electronics" },
      { name: "Travel", path: "/category/travel" },
      { name: "Food & Dining", path: "/category/food-dining" },
      { name: "Health & Beauty", path: "/category/beauty" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "Youtube" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" className="w-6 h-6">
                    <path d="M32 12C21 12 12 21 12 32C12 43 21 52 32 52C37 52 41.5 50 45 47L41 43C38.5 45.5 35.5 47 32 47C23.7 47 17 40.3 17 32C17 23.7 23.7 17 32 17C40.3 17 47 23.7 47 32H42L49 42L56 32H52C52 21 43 12 32 12Z" fill="white"/>
                    <circle cx="32" cy="32" r="6" fill="white"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold font-heading text-secondary-foreground">
                  Cash<span className="text-primary">back</span>
                </span>
              </div>
            </Link>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              India's Top Cashback & Coupon Destination. Save money on every online purchase.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-secondary-foreground/10 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-secondary-foreground/70 hover:text-primary text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-secondary-foreground/70 hover:text-primary text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Help & Support</h4>
            <ul className="space-y-2">
              {footerLinks.help.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-secondary-foreground/70 hover:text-primary text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-secondary-foreground/70">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>support@cashback.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-secondary-foreground/70">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>+91 9999999999</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-secondary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>New Delhi, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-foreground/10">
        <div className="container mx-auto py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-secondary-foreground/60">
              © {new Date().getFullYear()} Cashback. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 opacity-60" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 opacity-60" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-6 opacity-60" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
