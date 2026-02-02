// Mock data for the application

// Helper function to generate placeholder logos
const getStoreLogo = (name: string, bgColor: string) => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=fff&size=128&bold=true`;

export const stores = [
  {
    id: "flipkart",
    name: "Flipkart",
    logo: getStoreLogo("FK", "2874F0"),
    cashback: "7%",
    cashbackType: "percent" as const,
    offersCount: 57,
    isTrending: true,
  },
  {
    id: "amazon",
    name: "Amazon",
    logo: getStoreLogo("AM", "FF9900"),
    cashback: "1.95%",
    cashbackType: "voucher" as const,
    offersCount: 71,
    isTrending: true,
  },
  {
    id: "ajio",
    name: "AJIO",
    logo: getStoreLogo("AJ", "4A4A4A"),
    cashback: "10%",
    cashbackType: "percent" as const,
    offersCount: 51,
  },
  {
    id: "itc-hotels",
    name: "ITC Hotels",
    logo: getStoreLogo("ITC", "8B4513"),
    cashback: "₹5000",
    cashbackType: "flat" as const,
    offersCount: 5,
    isNew: true,
  },
  {
    id: "dot-and-key",
    name: "Dot & Key",
    logo: getStoreLogo("D&K", "FF69B4"),
    cashback: "14%",
    cashbackType: "percent" as const,
    offersCount: 14,
  },
  {
    id: "reliancedigital",
    name: "Reliance Digital",
    logo: getStoreLogo("RD", "E42529"),
    cashback: "3.2%",
    cashbackType: "percent" as const,
    offersCount: 10,
  },
  {
    id: "realme",
    name: "Realme",
    logo: getStoreLogo("RM", "FFC600"),
    cashback: "1.9%",
    cashbackType: "percent" as const,
    offersCount: 6,
  },
  {
    id: "kiwi",
    name: "Kiwi",
    logo: getStoreLogo("KW", "00B2A9"),
    cashback: "₹1700",
    cashbackType: "flat" as const,
    offersCount: 1,
    isNew: true,
  },
  {
    id: "mystore",
    name: "Mystore",
    logo: getStoreLogo("MS", "6C5CE7"),
    cashback: "20%",
    cashbackType: "flat" as const,
    offersCount: 5,
  },
  {
    id: "agoda",
    name: "Agoda",
    logo: getStoreLogo("AG", "E42529"),
    cashback: "4%",
    cashbackType: "flat" as const,
    offersCount: 10,
  },
  {
    id: "savana",
    name: "Savana",
    logo: getStoreLogo("SV", "2ECC71"),
    cashback: "5%",
    cashbackType: "percent" as const,
    offersCount: 8,
  },
  {
    id: "croma",
    name: "Croma",
    logo: getStoreLogo("CR", "00A650"),
    cashback: "3.15%",
    cashbackType: "percent" as const,
    offersCount: 27,
  },
  {
    id: "myntra",
    name: "Myntra",
    logo: getStoreLogo("MY", "FF3F6C"),
    cashback: "5%",
    cashbackType: "percent" as const,
    offersCount: 45,
    isTrending: true,
  },
  {
    id: "swiggy",
    name: "Swiggy",
    logo: getStoreLogo("SW", "FC8019"),
    cashback: "3%",
    cashbackType: "percent" as const,
    offersCount: 12,
  },
  {
    id: "zomato",
    name: "Zomato",
    logo: getStoreLogo("ZO", "E23744"),
    cashback: "2.5%",
    cashbackType: "percent" as const,
    offersCount: 8,
  },
  {
    id: "makemytrip",
    name: "MakeMyTrip",
    logo: getStoreLogo("MMT", "E8382A"),
    cashback: "6%",
    cashbackType: "percent" as const,
    offersCount: 23,
  },
];

export const deals = [
  {
    id: "deal1",
    title: "Flat 50% OFF on Fashion + Extra 10% Cashback",
    description: "Get amazing discounts on top fashion brands. Limited time offer valid on orders above ₹999.",
    store: { name: "Flipkart", logo: getStoreLogo("FK", "2874F0") },
    couponCode: "FASHION50",
    cashback: "10%",
    expiresAt: "Ends in 2 days",
    isExclusive: true,
    isVerified: true,
  },
  {
    id: "deal2",
    title: "₹500 OFF on First Hotel Booking",
    description: "Save big on your first hotel booking. Minimum booking value ₹2000 required.",
    store: { name: "MakeMyTrip", logo: getStoreLogo("MMT", "E8382A") },
    couponCode: "FIRSTHOTEL",
    cashback: "₹200",
    expiresAt: "Ends in 5 days",
    isVerified: true,
  },
  {
    id: "deal3",
    title: "Upto 70% OFF on Electronics",
    description: "Huge discounts on mobiles, laptops, TVs and more. Don't miss out!",
    store: { name: "Amazon", logo: getStoreLogo("AM", "FF9900") },
    cashback: "2%",
    expiresAt: "Ends Today",
    isExclusive: true,
  },
  {
    id: "deal4",
    title: "Buy 2 Get 1 FREE on Skincare",
    description: "Stock up on your favorite skincare products with this amazing offer.",
    store: { name: "Dot & Key", logo: getStoreLogo("D&K", "FF69B4") },
    couponCode: "SKIN21",
    cashback: "14%",
    expiresAt: "Ends in 7 days",
    isVerified: true,
  },
  {
    id: "deal5",
    title: "Flat 40% OFF on AJIO Brands",
    description: "Exclusive discount on all AJIO private labels. Shop the latest trends.",
    store: { name: "AJIO", logo: getStoreLogo("AJ", "4A4A4A") },
    couponCode: "AJIO40",
    cashback: "10%",
    expiresAt: "Ends in 3 days",
    isExclusive: true,
    isVerified: true,
  },
  {
    id: "deal6",
    title: "Free Delivery on Food Orders Above ₹149",
    description: "Order your favorite food and get free delivery. Valid on selected restaurants.",
    store: { name: "Swiggy", logo: getStoreLogo("SW", "FC8019") },
    cashback: "3%",
    expiresAt: "Ongoing",
  },
];

export const bannerSlides = [
  {
    id: "banner1",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop",
    alt: "Big Sale - Up to 70% OFF",
  },
  {
    id: "banner2",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop",
    alt: "Fashion Sale - Extra Cashback",
  },
  {
    id: "banner3",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=400&fit=crop",
    alt: "Travel Deals - Save More",
  },
  {
    id: "banner4",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop",
    alt: "Electronics Sale",
  },
];

export const faqs = [
  {
    question: "What is Cashback?",
    answer: "Cashback is India's leading cashback and coupon website. We help you save money on your online purchases by providing cashback on your shopping from 300+ online stores.",
  },
  {
    question: "How does cashback work?",
    answer: "When you shop through Cashback, we earn a commission from the store. We share a major portion of this commission with you as cashback. Simply log in to Cashback, click on your favorite store, shop as usual, and earn cashback!",
  },
  {
    question: "How can I withdraw my cashback?",
    answer: "Once your cashback is confirmed and you have a minimum balance of ₹99, you can withdraw it directly to your bank account, Paytm wallet, or choose from various gift vouchers.",
  },
  {
    question: "How long does it take for cashback to be confirmed?",
    answer: "Cashback tracking typically happens within 24-48 hours of your purchase. The confirmation time varies by store, usually between 30-90 days after the purchase.",
  },
  {
    question: "Why is my cashback pending?",
    answer: "Cashback remains pending until the store confirms your purchase and the return period is over. This is to ensure that returns and cancellations are handled properly.",
  },
  {
    question: "What should I do if my cashback is missing?",
    answer: "If your cashback is not tracked within 7 days, you can raise a missing cashback claim from your dashboard. Please keep your order confirmation email handy.",
  },
  {
    question: "Can I use coupons with cashback?",
    answer: "Yes! You can use store coupons along with earning cashback. However, some specific coupon codes may not be eligible for cashback. Always check the store page for details.",
  },
  {
    question: "Is Cashback free to use?",
    answer: "Yes, Cashback is completely free to use. There are no membership fees or hidden charges. Simply sign up and start saving!",
  },
];

export const userTransactions = [
  {
    id: "txn1",
    store: "Flipkart",
    storeLogo: getStoreLogo("FK", "2874F0"),
    orderAmount: "₹2,499",
    cashback: "₹175",
    status: "confirmed",
    date: "Dec 15, 2024",
  },
  {
    id: "txn2",
    store: "Amazon",
    storeLogo: getStoreLogo("AM", "FF9900"),
    orderAmount: "₹5,999",
    cashback: "₹120",
    status: "pending",
    date: "Dec 14, 2024",
  },
  {
    id: "txn3",
    store: "Myntra",
    storeLogo: getStoreLogo("MY", "FF3F6C"),
    orderAmount: "₹1,299",
    cashback: "₹65",
    status: "confirmed",
    date: "Dec 10, 2024",
  },
  {
    id: "txn4",
    store: "Swiggy",
    storeLogo: getStoreLogo("SW", "FC8019"),
    orderAmount: "₹450",
    cashback: "₹14",
    status: "cancelled",
    date: "Dec 8, 2024",
  },
];

// Gift card images
export const giftCardImages = {
  amazon: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=250&fit=crop",
  flipkart: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=250&fit=crop",
  myntra: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=250&fit=crop",
  swiggy: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop",
  zomato: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop",
  makemytrip: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=250&fit=crop",
  bookmyshow: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=250&fit=crop",
  uber: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=250&fit=crop",
};