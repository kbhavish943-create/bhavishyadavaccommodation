// script.js -- fully self-contained interactions

// Utilities
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// DOM Elements
const themeToggle = $('#theme-toggle');
const navToggle = $('#nav-toggle');
const navList = $('#nav-list');
const modal = $('#modal');
const modalBackdrop = modal && modal.querySelector('.modal-backdrop');
const modalClose = $('#modal-close');
const modalImage = $('#modal-image');
const modalTitle = $('#modal-title');
const modalDesc = $('#modal-desc');
const galleryItems = $$('.gallery-item');
const form = $('#contact-form');
const yearEl = $('#year');
const formStatus = $('#form-status');

// Put current year in footer
if (yearEl) yearEl.textContent = new Date().getFullYear();

// NAV toggle (mobile)
if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close menu when nav links clicked (mobile)
  navList.addEventListener('click', (e) => {
    if (e.target.matches('a')) {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded','false');
    }
  });
}

// THEME: prefers-color-scheme + manual toggle + localStorage
(function initTheme(){
  const saved = localStorage.getItem('site-theme'); // 'light' or 'dark'
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const root = document.documentElement;

  const apply = (mode) => {
    if (mode === 'light') {
      root.classList.add('light');
      if (themeToggle) {
        themeToggle.textContent = '☀️';
        themeToggle.setAttribute('aria-pressed','true');
      }
    } else {
      root.classList.remove('light');
      if (themeToggle) {
        themeToggle.textContent = '🌙';
        themeToggle.setAttribute('aria-pressed','false');
      }
    }
  };

  // initial
  apply(saved || (prefersLight ? 'light' : 'dark'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light');
      const mode = isLight ? 'light' : 'dark';
      localStorage.setItem('site-theme', mode);
      apply(mode);
    });
  }
})();

// Smooth scrolling for internal links
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id === '#' || id === '#0') return;
  const target = document.querySelector(id);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({behavior:'smooth', block:'start'});
  }
});

// GALLERY: open modal when clicking item
if (galleryItems.length && modal && modalBackdrop && modalClose && modalImage && modalTitle && modalDesc) {
  function openModal(title, desc, contentHtml){
    modalImage.innerHTML = contentHtml;
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modal.setAttribute('aria-hidden','false');
    // trap focus: focus close button
    modalClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    modalImage.innerHTML = '';
    document.body.style.overflow = '';
  }

  galleryItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title || 'Image';
      const desc = btn.dataset.desc || '';
      // grab inner svg for display (clone)
      const svg = btn.querySelector('svg');
      const markup = svg ? svg.outerHTML : '<div style="padding:40px">No preview</div>';
      openModal(title, desc, markup);
    });
  });

  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });
}

// CONTACT FORM: client-side validation + SQL database submit
if (form) {
  const nameEl = $('#name');
  const emailEl = $('#email');
  const msgEl = $('#message');

  const errName = $('#err-name');
  const errEmail = $('#err-email');
  const errMsg = $('#err-message');

  function validate(){
    let ok = true;
    // name
    if (!nameEl.value.trim() || nameEl.value.trim().length < 2) {
      errName.textContent = 'Please enter your name (2+ characters).';
      ok = false;
    } else { errName.textContent = ''; }

    // email (simple regex)
    const email = emailEl.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEmail.textContent = 'Please enter a valid email.';
      ok = false;
    } else { errEmail.textContent = ''; }

    // message
    if (!msgEl.value.trim() || msgEl.value.trim().length < 10) {
      errMsg.textContent = 'Message should be at least 10 characters.';
      ok = false;
    } else { errMsg.textContent = ''; }

    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (formStatus) formStatus.hidden = true;

    if (!validate()) {
      if (formStatus) {
        formStatus.hidden = false;
        formStatus.classList.remove('success');
        formStatus.classList.add('error');
        formStatus.textContent = 'Please correct the highlighted fields.';
      }
      return;
    }

    // Show sending status
    if (formStatus) {
      formStatus.hidden = false;
      formStatus.classList.remove('success', 'error');
      formStatus.textContent = 'Sending…';
    }

    // disable form
    const elements = Array.from(form.elements);
    elements.forEach(el => el.disabled = true);

    try {
      // Submit to server API (Node.js/Express) - change BASE if your server runs elsewhere
      const API_BASE = window.API_BASE || 'http://localhost:3000';
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nameEl.value.trim(),
          email: emailEl.value.trim(),
          message: msgEl.value.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        if (formStatus) {
          formStatus.classList.add('success');
          formStatus.textContent = '✓ ' + result.message;
        }
        form.reset();
        if (formStatus) {
          setTimeout(() => {
            formStatus.hidden = true;
          }, 4000);
        }
      } else {
        if (formStatus) {
          formStatus.classList.add('error');
          formStatus.textContent = '✗ ' + (result.message || 'Error submitting form. Please try again.');
          setTimeout(() => {
            formStatus.hidden = true;
          }, 4000);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      if (formStatus) {
        formStatus.classList.add('error');
        formStatus.textContent = '✗ Network error. Please check your connection and try again.';
        setTimeout(() => {
          formStatus.hidden = true;
        }, 4000);
      }
    } finally {
      elements.forEach(el => el.disabled = false);
    }
  });
}

// keyboard accessibility: trap focus in modal while open (basic)
document.addEventListener('focus', function(e){
  if (modal && modal.getAttribute('aria-hidden') === 'false') {
    if (!modal.contains(e.target)) {
      e.stopPropagation();
      if (modalClose) modalClose.focus();
    }
  }
}, true);

// ============ MULTI-AI FAILOVER SUPPORT SYSTEM ============
// This system implements a robust multi-provider AI strategy with intelligent failover.
// It attempts multiple AI services in sequence to ensure uninterrupted support.

/*
  Multi-AI Failover Architecture:
  
  1. PRIMARY: External AI Service (e.g., Claude/OpenAI API)
     - Best for advanced conversational responses
     - Handles complex queries with context awareness
     - Fallback if: Rate limited, offline, or error
  
  2. SECONDARY: Alternative External Service (e.g., Google Gemini/Hugging Face)
     - Medium-tier AI for general support
     - Provides contextual responses
     - Fallback if: Also unavailable
  
  3. TERTIARY: Local Knowledge Base
     - Keyword-based matching with curated responses
     - Always available, no API dependency
     - Final fallback - never fails
*/

// ============ AI SERVICE PROVIDERS ============
const aiProviders = {
  // Primary AI Service (e.g., Claude/OpenAI)
  async primary(query) {
    try {
      console.log('Attempting PRIMARY AI service...');
      // Future: Replace with actual API call to OpenAI/Claude
      // Example: const response = await fetch('/api/ai/primary', { ... });
      // For now, simulate with timeout
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Placeholder - would call real API
          reject(new Error('Primary service not configured'));
        }, 500);
      });
    } catch (error) {
      console.error('Primary AI error:', error);
      throw error;
    }
  },

  // Secondary AI Service (e.g., Google Gemini/Hugging Face)
  async secondary(query) {
    try {
      console.log('Attempting SECONDARY AI service...');
      // Future: Replace with actual API call to Google/HuggingFace
      // Example: const response = await fetch('/api/ai/secondary', { ... });
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Secondary service not configured'));
        }, 500);
      });
    } catch (error) {
      console.error('Secondary AI error:', error);
      throw error;
    }
  },

  // Tertiary: Local Knowledge Base (Always Available)
  async tertiary(query) {
    console.log('Using TERTIARY (Local Knowledge Base)...');
    return findKnowledgeBaseResponse(query);
  }
};

// ============ FAILOVER HANDLER ============
/*
  This function implements intelligent failover:
  1. Tries primary AI service first
  2. If fails, attempts secondary AI service
  3. If both fail, falls back to local knowledge base
  4. Logs all attempts for monitoring
*/
async function handleUserQueryWithFailover(userQuery) {
  console.log('User Query:', userQuery);
  
  // Step 1: Attempt Primary AI Service
  try {
    console.log('Step 1: Trying Primary AI...');
    const response = await aiProviders.primary(userQuery);
    console.log('✓ Primary AI Success');
    return { response, provider: 'primary' };
  } catch (primaryError) {
    console.warn('Primary AI failed:', primaryError.message);
    
    // Step 2: Attempt Secondary AI Service
    try {
      console.log('Step 2: Primary failed, trying Secondary AI...');
      const response = await aiProviders.secondary(userQuery);
      console.log('✓ Secondary AI Success');
      return { response, provider: 'secondary' };
    } catch (secondaryError) {
      console.warn('Secondary AI failed:', secondaryError.message);
      
      // Step 3: Fallback to Local Knowledge Base (Always works)
      console.log('Step 3: Both primary & secondary failed, using Local Knowledge Base...');
      try {
        const response = await aiProviders.tertiary(userQuery);
        console.log('✓ Local Knowledge Base Success');
        return { response, provider: 'tertiary' };
      } catch (tertiaryError) {
        console.error('Critical Error: All AI services failed');
        return {
          response: [
            'Sorry, I\'m temporarily unavailable.',
            'Please contact us directly:',
            '📧 kbhavish943@gmail.com',
            '📱 +91 87091 88179'
          ],
          provider: 'error'
        };
      }
    }
  }
}

// ============ LOCAL KNOWLEDGE BASE (Enhanced) ============
const aiKnowledgeBase = {
  features: {
    keywords: ['features', 'what can', 'capabilities', 'what do you offer', 'amenities', 'what included'],
    responses: [
      '🏠 Our Premium Student Lodge Features:',
      '',
      '🛏️ Room Options:',
      '• Single Room (₹2100/month) - Private room with study desk',
      '• Double Room (₹2500/month) - Spacious for roommates',
      '• Premium AC Room (₹3000/month) - AC + Enhanced furnishings',
      '• Deluxe Double AC (₹3000/month) - AC + Mini kitchen',
      '',
      '📶 Connectivity & Utilities:',
      '• High-Speed WiFi 24/7 in all areas',
      '• Uninterrupted Electricity Supply',
      '• 24×7 Water Supply (Hot & Cold)',
      '• Backup Power (Inverter) Available',
      '',
      '📚 Study & Work Spaces:',
      '• Individual study desk in every room',
      '• Common study area with library',
      '• Computer lab access (if available)',
      '• Quiet zones for focused learning',
      '',
      '🔐 Safety & Security:',
      '• 24/7 Professional Security Staff',
      '• CCTV Surveillance System',
      '• Restricted Access with ID Cards',
      '• Emergency Response Team',
      '',
      '🍽️ Living Amenities:',
      '• Fully Equipped Common Kitchen',
      '• Laundry & Ironing Services',
      '• Housekeeping & Daily Cleaning',
      '• Recreation Area with TV/Gaming',
      '• Medical Support & First Aid',
      '',
      'Ready to experience comfortable student living?'
    ]
  },
  booking: {
    keywords: ['booking', 'book', 'reserve', 'how to book', 'process', 'register', 'apply'],
    responses: [
      '📋 Simple 6-Step Booking Process:',
      '',
      '1️⃣ Browse - Visit our Room Types page to see all options',
      '   Options: ₹2100 (Single), ₹2500-5000 (Double), ₹2100-10000 (Premium AC)',
      '',
      '2️⃣ Choose - Select the room type that fits your budget',
      '   Consider your study needs & lifestyle',
      '',
      '3️⃣ Contact Us:',
      '   📧 Email: kbhavish943@gmail.com',
      '   📱 Phone: +91 87091 88179',
      '   Message: Tell us your preferred room & move-in date',
      '',
      '4️⃣ Verification:',
      '   Provide valid Student ID/College ID',
      '   Basic personal & emergency contact info',
      '   Proof of enrollment or college letter',
      '',
      '5️⃣ Payment:',
      '   ✅ First Month Rent + Security Deposit',
      '   ✅ Multiple payment options: Bank Transfer, UPI, Online',
      '   ✅ Receipts provided for all payments',
      '',
      '6️⃣ Move In:',
      '   📅 Check-in on agreed date',
      '   🔑 Receive keys & orientation',
      '   📋 Sign lease agreement',
      '',
      '⏱️ Typical booking time: 24-48 hours',
      '💼 Flexible lease terms: 6 months to 2 years',
      'Any questions? Contact us anytime!'
    ]
  },
  rooms: {
    keywords: ['rooms', 'room types', 'single', 'double', 'premium', 'deluxe', 'accommodation', 'which room', 'room size'],
    responses: [
      '🛏️ Complete Room Guide - Choose Your Perfect Space:',
      '',
      '💚 SINGLE ROOM - ₹2100/Month',
      '  Size: Individual private room',
      '  For: 1 student',
      '  Includes:',
      '   • Single bed with quality mattress',
      '   • Study desk & chair',
      '   • Attached bathroom (private)',
      '   • Cupboard for belongings',
      '   • WiFi & Electricity included',
      '   • Basic furniture',
      '  Perfect for: Focused students who prefer privacy',
      '',
      '💙 DOUBLE ROOM - ₹2500/Month',
      '  Size: Spacious shared room',
      '  For: 2 students',
      '  Includes:',
      '   • Two single beds with quality mattress',
      '   • Individual study desks & chairs',
      '   • Attached bathroom (shared)',
      '   • Two cupboards for storage',
      '   • WiFi & Electricity included',
      '   • Good natural ventilation',
      '  Perfect for: Friends or compatible roommates',
      '',
      '💜 PREMIUM AC ROOM - ₹3000/Month',
      '  Size: Individual AC room',
      '  For: 1 student',
      '  Includes:',
      '   • Single bed (premium quality)',
      '   • AC (temperature controlled)',
      '   • Study desk & chair',
      '   • Attached bathroom (private)',
      '   • Attached mini-kitchen',
      '   • WiFi & Electricity included',
      '   • Premium bedding & furnishings',
      '  Perfect for: Students who value comfort & privacy',
      '',
      '💖 DELUXE DOUBLE AC - ₹3000/Month',
      '  Size: Spacious AC room for 2',
      '  For: 2 students/friends',
      '  Includes:',
      '   • Two single beds (premium quality)',
      '   • AC (temperature controlled)',
      '   • Two study desks & chairs',
      '   • Attached bathroom (shared)',
      '   • Mini-kitchen for cooking together',
      '   • WiFi & Electricity included',
      '   • Premium furnishings & comfort',
      '  Perfect for: Friends wanting premium shared space',
      '',
      '✅ ALL ROOMS INCLUDE:',
      '   ✓ Furnished setup (bed, desk, cupboard)',
      '   ✓ 24/7 WiFi internet',
      '   ✓ Electricity included in rent',
      '   ✓ Water supply 24×7',
      '   ✓ Regular housekeeping',
      '   ✓ 24/7 security',
      '',
      'Which room suits you best? Contact us to book now!'
    ]
  },
  pricing: {
    keywords: ['price', 'pricing', 'cost', 'fee', 'how much', 'charge', 'rent', 'monthly', 'deposit', 'payment'],
    responses: [
      '💰 Transparent Pricing Structure:',
      '',
      '📊 MONTHLY RENT RATES:',
      '  🟢 Single Room: ₹2,100/month',
      '  🔵 Double Room: ₹2,500/month',
      '  🟣 Premium AC Single: ₹3,000/month',
      '  🌸 Deluxe AC Double: ₹3,000/month',
      '',
      '💳 FIRST PAYMENT BREAKDOWN:',
      '  • 1st Month Rent (Full Amount)',
      '  • Security Deposit (1× Monthly Rent)',
      '  • Registration Fee (₹500-1000, if any)',
      '',
      'Example (Single Room):',
      '  → 1st Month: ₹2,100',
      '  → Deposit: ₹2,100',
      '  → Registration: ₹500',
      '  → TOTAL: ₹4,700',
      '',
      '✅ PAYMENT OPTIONS:',
      '  • Bank Transfer',
      '  • UPI/Mobile Wallets',
      '  • Online Payments',
      '  • Cash (on verification)',
      '',
      '🎯 WHAT\'S INCLUDED IN RENT:',
      '  ✓ Room & Furniture',
      '  ✓ WiFi Internet (High-Speed)',
      '  ✓ Electricity',
      '  ✓ Water Supply (24×7)',
      '  ✓ Housekeeping (Cleaning)',
      '  ✓ Security (24/7)',
      '  ✓ Common Amenities',
      '',
      '🔒 DEPOSIT DETAILS:',
      '  • Fully refundable within 30 days of checkout',
      '  • Deducted only for damages beyond normal wear',
      '  • No hidden charges or deductions',
      '',
      '⏰ PAYMENT TERMS:',
      '  • Monthly rent due on 1st of each month',
      '  • Flexible lease: 6 months to 2 years',
      '  • Early payment discounts available',
      '',
      '👥 GROUP BOOKINGS:',
      '  Special discounts available for 2+ rooms!',
      '  Contact us for customized pricing',
      '',
      '❓ Questions about pricing? Contact us:',
      '📧 kbhavish943@gmail.com',
      '📱 +91 87091 88179'
    ]
  },
  facilities: {
    keywords: ['facilities', 'kitchen', 'laundry', 'study', 'recreation', 'amenities', 'what available', 'common area'],
    responses: [
      '🏢 Complete Facilities & Amenities Available:',
      '',
      '🍽️ KITCHEN FACILITIES:',
      '  • Fully equipped common kitchen',
      '  • Cooking utensils & appliances',
      '  • Gas & Cooking fuel provided',
      '  • Refrigerator, Microwave available',
      '  • Shared dining area',
      '  • Regular cleaning & maintenance',
      '',
      '🧺 LAUNDRY SERVICES:',
      '  • Washing machines available',
      '  • Professional ironing service',
      '  • Drying area with racks',
      '  • Affordable laundry costs',
      '  • Quick turnaround time',
      '',
      '📚 STUDY FACILITIES:',
      '  • Individual study desk in every room',
      '  • Common study library area',
      '  • High-speed WiFi throughout',
      '  • Quiet study zones',
      '  • Computer access (if available)',
      '  • Good lighting & ventilation',
      '',
      '📺 RECREATION AREAS:',
      '  • TV lounge with cable',
      '  • Gaming area (if available)',
      '  • Indoor games',
      '  • Comfortable seating',
      '  • Space for socializing',
      '',
      '🏥 HEALTH & MEDICAL:',
      '  • First-aid medical kit',
      '  • 1 km from Sadar Hospital',
      '  • Emergency medical support',
      '  • Health consultation available',
      '',
      '🧹 HOUSEKEEPING SERVICES:',
      '  • Daily room cleaning',
      '  • Bathroom maintenance',
      '  • Common area cleaning',
      '  • Waste management',
      '  • Regular sanitization',
      '',
      '⚡ UTILITIES & INFRASTRUCTURE:',
      '  • 24×7 Electricity (with backup)',
      '  • Inverter backup system',
      '  • 24×7 Water supply',
      '  • Hot water availability',
      '  • Proper ventilation in all rooms',
      '',
      '🔐 PARKING & STORAGE:',
      '  • Dedicated bike parking',
      '  • Vehicle parking area',
      '  • Secure storage for belongings',
      '',
      'Everything you need for a comfortable stay! Book now!'
    ]
  },
  security: {
    keywords: ['security', 'safe', 'safety', 'cctv', 'gated', 'protection', 'guard', 'secure'],
    responses: [
      '🔐 Your Safety is Our TOP Priority:',
      '',
      '👮 SECURITY STAFF:',
      '  • 24/7 Professional Security Personnel',
      '  • Trained & Background Verified',
      '  • Vigilant monitoring all hours',
      '  • Rapid response to incidents',
      '  • Emergency support always available',
      '',
      '📹 SURVEILLANCE SYSTEM:',
      '  • CCTV cameras in all common areas',
      '  • Entry & exit monitoring',
      '  • Hallway coverage',
      '  • Recording maintained for safety',
      '  • Regular system maintenance',
      '',
      '🚪 ACCESS CONTROL:',
      '  • Secure gated entry',
      '  • ID-based entry system',
      '  • Guest registration process',
      '  • Restricted access after hours',
      '  • Individual room keys/locks',
      '',
      '🆘 EMERGENCY SERVICES:',
      '  • Emergency hotline: +91 87091 88179',
      '  • Quick emergency response',
      '  • 24/7 support team active',
      '  • Medical emergency assistance',
      '  • Police/authority coordination',
      '',
      '👥 RESIDENT SAFETY FEATURES:',
      '  • Safe community environment',
      '  • Regular safety briefings',
      '  • Fire safety equipment',
      '  • Fire extinguishers in place',
      '  • Emergency evacuation plan',
      '',
      '📱 COMMUNICATION:',
      '  • 24/7 phone support',
      '  • Email support available',
      '  • Quick response to queries',
      '  • Regular safety updates',
      '',
      '✅ VERIFICATION PROCESS:',
      '  • Student ID verification',
      '  • College enrollment confirmation',
      '  • Parent contact information',
      '  • Background check',
      '  • Safe community screening',
      '',
      '🎯 SAFETY RULES:',
      '  • No drugs or alcohol',
      '  • Respectful community behavior',
      '  • Guest visiting policies',
      '  • Noise & disturbance free',
      '  • Regular maintenance & cleanliness',
      '',
      '💯 Our Commitment:',
      'We provide a secure, safe environment where you can focus on your studies with complete peace of mind. Your safety & well-being are guaranteed! 🛡️',
      '',
      'Contact us for any safety concerns:',
      '📧 kbhavish943@gmail.com | 📱 +91 87091 88179'
    ]
  },
  location: {
    keywords: ['location', 'where', 'address', 'area', 'directions', 'nearby', 'near what', 'how to reach'],
    responses: [
      '📍 PERFECT LOCATION - Heart of Deoghar:',
      '',
      '🏘️ OUR ADDRESS:',
      'Baijnathpur, Bilasi, Deoghar',
      'Jharkhand, India',
      'Near SRD Classes and School',
      'Feature Education Road',
      '',
      '📊 WHAT\'S NEARBY (Walking Distance):',
      '',
      '🚂 Transportation:',
      '  • Deoghar Railway Station - 1 km away',
      '  • Bus Station - 0.5 km away',
      '  • Auto/Rickshaw stand - 200 meters',
      '',
      '🏥 Healthcare:',
      '  • Sadar Hospital - 1 km away',
      '  • Medical Clinics nearby',
      '  • Pharmacy stores within walking distance',
      '',
      '🛍️ Shopping & Markets:',
      '  • Local Market - 1 km away',
      '  • Grocery shops - 200-500 meters',
      '  • Shopping centers nearby',
      '  • ATMs & Banks - 0.5 km away',
      '',
      '📚 Education:',
      '  • SRD Classes & School - Very Close',
      '  • Sankalp Education - 1.5 km away',
      '  • Various colleges & institutes nearby',
      '',
      '🏪 Daily Essentials:',
      '  • Food joints & restaurants',
      '  • Tea stalls & cafes',
      '  • Stationery shops',
      '  • Mobile recharge centers',
      '',
      '⚡ Landmarks:',
      '  • Power House - Very Close',
      '  • Main roads connectivity',
      '  • Easy access to Deoghar town',
      '',
      '🚗 HOW TO REACH:',
      '1. From Railway Station: 1 km (2-3 min auto)',
      '2. From Bus Station: 0.5 km (1-2 min auto)',
      '3. From Airport: ~50 km (1 hour drive)',
      '4. Central Deoghar: 2-3 km',
      '',
      '✅ LOCATION BENEFITS:',
      '  ✓ Central location - everything nearby',
      '  ✓ Safe residential area',
      '  ✓ Easy transportation access',
      '  ✓ Close to educational institutes',
      '  ✓ Market & shopping nearby',
      '',
      'Perfect location for student living! Come visit us!'
    ]
  },
  general: {
    keywords: ['hello', 'hi', 'help', 'support', 'who', 'about', 'thanks', 'okay'],
    responses: [
      '👋 Welcome to BHAVISH YADAV ACCOMMODATION LODGE!',
      '',
      'I\'m your AI assistant here to help with:',
      '',
      '🏠 QUICK LINKS:',
      '  • 📊 Room Types & Pricing (₹2100-10000/month)',
      '  • 📋 How to Book Your Room',
      '  • 🎁 Amenities & Facilities Available',
      '  • 🔐 Safety & Security Features',
      '  • 📍 Location & Directions',
      '  • 👥 About Our Lodge & Owner',
      '',
      '❓ COMMON QUESTIONS:',
      '  • "Which room should I choose?"',
      '  • "What\'s the booking process?"',
      '  • "Are there group discounts?"',
      '  • "What utilities are included?"',
      '  • "Is the lodge safe?"',
      '',
      '📞 DIRECT CONTACT:',
      '  📧 Email: kbhavish943@gmail.com',
      '  📱 Phone: +91 87091 88179',
      '  💻 Website: bhavishyadavlodge.com',
      '',
      '✨ Why Choose Us?',
      '  ✅ Affordable rates (₹2100-10000)',
      '  ✅ Prime location in Deoghar',
      '  ✅ 24/7 Security & Facilities',
      '  ✅ Student-friendly environment',
      '  ✅ Supportive owner & staff',
      '  ✅ Flexible lease terms',
      '',
      'What would you like to know? Just ask! 😊'
    ]
  }
};

// Find matching response from local knowledge base
function findKnowledgeBaseResponse(userQuery) {
  const query = userQuery.toLowerCase();
  
  // Check each category in knowledge base
  for (const [category, data] of Object.entries(aiKnowledgeBase)) {
    for (const keyword of data.keywords) {
      if (query.includes(keyword)) {
        return data.responses;
      }
    }
  }
  
  // Default response if no match found
  return [
    'I\'m here to help! Could you ask about:',
    '• Room Types & Pricing (₹2100-10000)',
    '• How to Book a Room',
    '• Amenities & Facilities',
    '• Safety & Security',
    '• Contact Information',
    'Or reach out directly: kbhavish943@gmail.com | +91 87091 88179'
  ];
}

// ============ AI CHAT UI HANDLER ============
function initAIChat() {
  const chatInput = $('#ai-input');
  const chatSend = $('#ai-send');
  const chatMessages = $('#chat-messages');
  const suggestionBtns = $$('.suggestion-btn');
  const chatContainer = $('.ai-chat-container');

  if (!chatInput || !chatSend || !chatMessages) return;

  let isWaitingForResponse = false;
  let conversationHistory = [];

  // Add message to chat display with enhanced styling
  function addMessage(text, isUser = false, provider = null) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (Array.isArray(text)) {
      const html = text.map(line => {
        if (line.match(/^[•\d]+[.)]/)) {
          return `<div style="margin: 4px 0;">${line}</div>`;
        }
        if (line.match(/^[🏠📶📚🔐🍽️🧺🚲🔋💧⚡📊👔]/)) {
          return `<div style="font-weight: 600; margin-top: 8px;">${line}</div>`;
        }
        if (line.includes('₹')) {
          return `<div style="font-weight: 500; color: #00ff88;">${line}</div>`;
        }
        return `<div>${line}</div>`;
      }).join('');
      content.innerHTML = html;
    } else {
      content.textContent = text;
    }
    
    // Add provider indicator for bot messages
    if (!isUser && provider) {
      const providerIndicator = document.createElement('small');
      providerIndicator.style.cssText = 'display: block; margin-top: 10px; font-size: 0.75rem; opacity: 0.6; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;';
      const providerText = { 'primary': '🚀 Advanced AI', 'secondary': '✨ Smart AI', 'tertiary': '⚡ Quick Response', 'error': '⚠️ Support' }[provider] || provider;
      providerIndicator.textContent = providerText;
      content.appendChild(providerIndicator);
    }
    
    messageEl.appendChild(content);
    chatMessages.appendChild(messageEl);
    setTimeout(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }, 50);
    conversationHistory.push({ text: Array.isArray(text) ? text.join(' ') : text, isUser, timestamp: new Date() });
  }

  // Show typing indicator
  function showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message bot-message';
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = `<div class="message-content"><div style="display: flex; gap: 4px;"><span style="width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: bounce 1.4s infinite;"></span><span style="width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: bounce 1.4s 0.2s infinite;"></span><span style="width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: bounce 1.4s 0.4s infinite;"></span></div></div>`;
    chatMessages.appendChild(typingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingEl;
  }

  // Remove typing indicator
  function hideTypingIndicator() {
    const typingEl = $('#typing-indicator');
    if (typingEl) typingEl.remove();
  }

  // Handle message send
  async function sendMessage() {
    if (isWaitingForResponse) return;
    const userInput = chatInput.value.trim();
    if (!userInput) return;

    addMessage(userInput, true);
    chatInput.value = '';
    chatInput.focus();
    chatSend.disabled = true;
    isWaitingForResponse = true;

    const typingEl = showTypingIndicator();

    try {
      const { response, provider } = await handleUserQueryWithFailover(userInput);
      hideTypingIndicator();
      addMessage(response, false, provider);
    } catch (error) {
      console.error('Chat error:', error);
      hideTypingIndicator();
      addMessage(['😕 Sorry, something went wrong.', 'Contact us directly:', '📧 kbhavish943@gmail.com', '📱 +91 87091 88179'], false, 'error');
    } finally {
      chatSend.disabled = false;
      isWaitingForResponse = false;
    }
  }

  // Event listeners
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isWaitingForResponse) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Suggestion button handlers
  suggestionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.dataset.query;
      setTimeout(sendMessage, 100);
    });
  });

  chatInput.addEventListener('focus', () => {
    chatContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Welcome message
  addMessage(['👋 Welcome to BHAVISH YADAV ACCOMMODATION LODGE Support!', 'I\'m your AI assistant. Ask me about:', '• Room Types & Pricing (₹2100-10000/month)', '• How to Book Your Room', '• Amenities & Facilities', '• Safety & Security Features', '• Or just say Hi! 😊'], false, 'tertiary');
}

// Bounce animation for typing
const style = document.createElement('style');
style.textContent = '@keyframes bounce { 0%, 80%, 100% { transform: scaleY(0.5); opacity: 0.5; } 40% { transform: scaleY(1); opacity: 1; } }';
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', initAIChat);
