import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAssets } from '@/shared/hooks/useAssets';
import { LogoCarousel, SimpleLogoCarousel } from '@/shared/components/ui/LogoCarousel';

const TEAM_QUOTES = [
  { quote: "My mitigation strategy is: hedge, hope, pray", author: "SOLO YOLO" },
  { quote: "Structured thinking wins.", author: "Andrei Khristoliubov" },
  { quote: "Preparation is key", author: "Robert Zhulyev" },
  { quote: "An investment in knowledge pays the best interest", author: "Benji Crawford" },
  { quote: "A rising tide lifts all boats.", author: "Keshav Iyer" },
  { quote: "Markets can stay irrational longer than you can stay solvent.", author: "Daksh Sargiya" },
  { quote: "Numbers don't lie. People do.", author: "Aman Nagu" },
  { quote: "Cynicism is a sign of weakness.", author: "David Drăghici" },
  { quote: "Be a bit better everyday.", author: "Nicolae Darie-Nistor" },
  { quote: "Tomorrow does not exist. There is only now.", author: "Robert Jacob Oros" },
  { quote: "Battle scars from virtual capital prevent disasters with real capital.", author: "Hashim Ahmed" },
  { quote: "Code finds patterns, discipline captures profits.", author: "Arjun Juneja" },
  { quote: "Red is the new green.", author: "Dhriti Pareek" },
  { quote: "Audere est facere.", author: "David Labella" },
  { quote: "The best way to predict the future is to create it.", author: "Manraj Singh" },
  { quote: "An investment in knowledge pays the best interest.", author: "Tariq Howlader" },
  { quote: "I invest like I cook: a little messy, occasionally risky, but surprisingly effective.", author: "Sujay Aggarwal" },
  { quote: "When it comes to investing, some losses may be inevitable, but losing your composure is always optional.", author: "Sushant Shyam" },
  { quote: "In the midst of chaos, there is also opportunity.", author: "Aran Grant" },
  { quote: "Identifying catalysts before the market prices them in.", author: "Muzamel" },
  { quote: "Driving performance through rigorous research and disciplined allocation.", author: "Josh" },
  { quote: "Leveraging geopolitical insights to uncover value.", author: "Kabir" },
  { quote: "Buy the rumour, sell the news.", author: "Vadim Voloshin" },
  { quote: "Fearful when others are greedy, greedy when others are fearful.", author: "Sidhanth Srikanth" },
  { quote: "Price is what you pay, value is what you get.", author: "Jaime Sancho" },
  { quote: "Clients rarely applaud you for making money, but they never hesitate to judge you when you lose it.", author: "Hugo" },
  { quote: "Markets don't rise together, capital rotates, and outperformance belongs to those who move with the flow of money.", author: "Murathan" },
  { quote: "Sustainable performance is built on small, repeated decisions done right.", author: "Can" },
  { quote: "If only PDUFAs came with tracking numbers.", author: "Joaquim Silva" },
];

// Generate particle positions (memoized)
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 2,
    drift: (i % 3) + 1,
    isCyan: Math.random() > 0.6,
    delay: Math.random() * 5,
  }));
}

// Generate connecting lines between nearby particles
function generateLines(particles: ReturnType<typeof generateParticles>) {
  const lines: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) { // Only connect nearby particles
        lines.push({
          x1: particles[i].x,
          y1: particles[i].y,
          x2: particles[j].x,
          y2: particles[j].y,
          delay: Math.random() * 3,
        });
      }
    }
  }
  return lines;
}

export function LobbyScreen() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const { partners, loading: assetsLoading } = useAssets();

  // Memoize particles and lines
  const particles = useMemo(() => generateParticles(25), []);
  const lines = useMemo(() => generateLines(particles), [particles]);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % TEAM_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get university logos for carousel
  const universityLogos = partners?.universities.map(u => ({
    src: u.logo,
    alt: u.name,
  })) ?? [];

  // Get society logos for carousel
  const societyLogos = partners?.societies ?? [];

  // Get industry partners
  const industryPartners = partners?.industry ?? [];

  // Get event partners
  const eventPartners = partners?.event ?? [];

  // Get organisers
  const organisers = partners?.organisers ?? [];

  return (
    <div className="bg-navy-950 relative" style={{ minHeight: '100vh', overflowY: 'scroll' }}>
      {/* ========== PARTICLE NETWORK BACKGROUND ========== */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient overlays */}
        <motion.div
          className="absolute top-0 right-0 w-[70%] h-full"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(0, 85, 254, 0.15) 50%, rgba(0, 217, 255, 0.1) 100%)',
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-mcd-500/10 rounded-full blur-[150px]"
          animate={{ x: [0, 80, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]"
          animate={{ x: [0, -60, 0], y: [0, -80, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Particle Network */}
        <div className="particle-network">
          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full">
            {lines.map((line, idx) => (
              <motion.line
                key={idx}
                x1={`${line.x1}%`}
                y1={`${line.y1}%`}
                x2={`${line.x2}%`}
                y2={`${line.y2}%`}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.05, 0.2, 0.05] }}
          transition={{
                  duration: 4,
            repeat: Infinity,
                  delay: line.delay,
            ease: 'easeInOut',
          }}
        />
            ))}
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0, 85, 254, 0.3)" />
                <stop offset="50%" stopColor="rgba(0, 217, 255, 0.2)" />
                <stop offset="100%" stopColor="rgba(0, 85, 254, 0.3)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Particles */}
          {particles.map((p) => (
          <motion.div
              key={p.id}
              className={`particle ${p.isCyan ? 'cyan' : ''} drift-${p.drift}`}
            style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: `${p.delay}s`,
            }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: p.delay * 0.2, duration: 1 }}
          />
        ))}
        </div>
      </div>

      {/* ========== CONTENT ========== */}
      <div className="relative z-10">

        {/* Hero Section */}
        <div className="pt-16 pb-12 px-12 text-center">
          
          {/* Organisers logos centered above title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex items-center justify-center gap-8 mb-8"
          >
            {organisers.map((org, idx) => (
              <motion.img
                key={org.name}
                src={org.logoDark}
                alt={org.name}
                className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.8, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.6 }}
              />
            ))}
          </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
            <p className="text-2xl text-mcd-400 font-medium mb-4">5th December 2025</p>
            <h1 className="text-8xl md:text-9xl font-display tracking-wider mb-4">
            <span className="text-gradient">GRAND FINALE</span>
          </h1>
            <h2 className="text-4xl md:text-5xl text-white/90 font-light">
            UK Investment Competition
          </h2>
        </motion.div>
        </div>

        {/* Heard from our teams + Quote */}
        <div className="pb-12 px-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="text-lg text-muted-foreground mb-4">Heard from our teams</p>
            <motion.div
              key={currentQuoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xl text-white/90 italic mb-2">
                "{TEAM_QUOTES[currentQuoteIndex].quote}"
              </p>
              <p className="text-base text-mcd-400">
                — {TEAM_QUOTES[currentQuoteIndex].author}
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Industry Partners - with glow pulse + float */}
        <div className="pb-10 px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
            className="max-w-6xl mx-auto"
        >
            <p className="text-center text-sm text-muted-foreground uppercase tracking-widest mb-6">
              Industry Partners
            </p>
            <div className="grid grid-cols-5 gap-10 items-center justify-items-center">
              {industryPartners.map((partner, idx) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + idx * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className={`group relative flex items-center justify-center animate-float-glow float-delay-${(idx % 5) + 1}`}
              >
                  <img
                    src={partner.logoDark || partner.logo}
                    alt={partner.name}
                    className="h-16 w-auto max-w-[180px] object-contain relative z-10"
                  />
              </motion.div>
            ))}
          </div>
        </motion.div>
        </div>

        {/* Event Partners - with float animation */}
        <div className="pb-12 px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="max-w-5xl mx-auto"
          >
            <p className="text-center text-sm text-muted-foreground uppercase tracking-widest mb-5">
              Event Partners
            </p>
            <div className="flex justify-center items-center gap-16 flex-wrap">
              {eventPartners.map((partner, idx) => {
                // Make Finimize, MCD Capital, and Wall Street Skinny logos much bigger
                const isBiggerLogo = ['Finimize', 'MCD Capital', 'Wall Street Skinny'].includes(partner.name);
                return (
                  <motion.div
                    key={partner.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 + idx * 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    className={`group animate-float-subtle float-delay-${(idx % 6) + 1}`}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className={`${isBiggerLogo ? 'h-24' : 'h-16'} w-auto object-contain opacity-80 group-hover:opacity-100 transition-all duration-300`}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* University Partners Carousel */}
        {!assetsLoading && universityLogos.length > 0 && (
          <div className="pb-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              <p className="text-center text-sm text-muted-foreground uppercase tracking-widest mb-4">
                University Partners
              </p>
              <LogoCarousel
                logos={universityLogos}
                duration={45}
                direction="left"
                logoHeight={48}
                gap={80}
                grayscale={false}
              />
            </motion.div>
          </div>
        )}

        {/* Societies Carousel */}
        {!assetsLoading && societyLogos.length > 0 && (
          <div className="pb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              <p className="text-center text-sm text-muted-foreground uppercase tracking-widest mb-4">
                Finance Societies
              </p>
              <SimpleLogoCarousel
                images={societyLogos}
                duration={40}
                direction="right"
                imageHeight={44}
                gap={60}
              />
            </motion.div>
          </div>
        )}

        {/* Footer */}
        <div className="pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-4 px-8 py-3 bg-mcd-500/10 border border-mcd-500/30 rounded-full backdrop-blur-sm">
              <motion.div
                className="w-3 h-3 bg-mcd-500 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-lg text-mcd-400">Event starting soon • Please take your seats</span>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
