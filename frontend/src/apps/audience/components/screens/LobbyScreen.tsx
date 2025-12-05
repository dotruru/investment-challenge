import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Team } from '@/shared/types';
import { useAssets } from '@/shared/hooks/useAssets';
import { LogoCarousel, SimpleLogoCarousel } from '@/shared/components/ui/LogoCarousel';

const FUNNY_QUOTES = [
  "Buy low, sell high... if only it were that simple!",
  "May your Sharpe ratio be ever in your favor",
  "Remember: Past performance is not indicative... but it's all we've got!",
  "The trend is your friend, until it isn't",
  "Diversify they said. It'll be fun they said.",
  "Warren Buffett never had to deal with meme stocks",
  "Risk-adjusted returns: making losses sound sophisticated since 1966",
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
  const { eventId } = useParams<{ eventId: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const { partners, loading: assetsLoading } = useAssets();

  // Memoize particles and lines
  const particles = useMemo(() => generateParticles(25), []);
  const lines = useMemo(() => generateLines(particles), [particles]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch(`/api/v1/events/${eventId}/display`);
        const data = await response.json();
        setTeams(data.teams || []);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    };
    if (eventId) loadTeams();
  }, [eventId]);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % FUNNY_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate teams
  useEffect(() => {
    if (teams.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [teams.length]);

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
        
        {/* UMushroom top right */}
        <div className="absolute top-8 right-12">
          {organisers[1] && (
            <motion.img
              src={organisers[1].logoDark}
              alt={organisers[1].name}
              className="h-14 w-auto opacity-70 hover:opacity-100 transition-opacity animate-float-subtle"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 0.7, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            />
          )}
        </div>

        {/* Hero Section */}
        <div className="pt-24 pb-12 px-12 text-center">
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

        {/* Team Carousel */}
        <div className="pb-8 px-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="h-20"
          >
            {teams.length > 0 && (
              <motion.div
                key={currentTeamIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-lg text-muted-foreground mb-2">Featuring</p>
                <div className="flex items-center justify-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-mcd-500/20">
                    {teams[currentTeamIndex]?.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">{teams[currentTeamIndex]?.name}</p>
                    <p className="text-lg text-muted-foreground">{teams[currentTeamIndex]?.university}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Quote */}
        <div className="pb-12 px-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.p
              key={currentQuoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl text-muted-foreground italic"
            >
              "{FUNNY_QUOTES[currentQuoteIndex]}"
            </motion.p>
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
            <div className="flex justify-center items-center gap-12 flex-wrap">
              {eventPartners.map((partner, idx) => (
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
                    className="h-12 w-auto object-contain opacity-80 group-hover:opacity-100 transition-all duration-300"
                  />
                </motion.div>
              ))}
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
          >
            <div className="flex items-center justify-center gap-8 mb-5">
              <p className="text-lg text-muted-foreground">Organised by</p>
              <div className="flex items-center gap-6">
                {organisers.map((org, idx) => (
                  <img
                    key={org.name}
                    src={org.logoDark}
                    alt={org.name}
                    className={`h-12 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity animate-float-subtle float-delay-${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="inline-flex items-center gap-4 px-8 py-3 bg-mcd-500/10 border border-mcd-500/30 rounded-full backdrop-blur-sm">
                <motion.div
                  className="w-3 h-3 bg-mcd-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-lg text-mcd-400">Event starting soon • Please take your seats</span>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
