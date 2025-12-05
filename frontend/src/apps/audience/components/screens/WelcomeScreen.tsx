import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import type { PersonProfile } from '@/shared/types';

// Partner logos - organisers
const PARTNER_LOGOS = [
  { name: 'MCD Edu', logo: '/assets/DATAROOM/SPONSOR LOGOS/1. ORGANISERS  (EVERYWHERE!)/MCD - White.png' },
  { name: 'UMushroom', logo: '/assets/DATAROOM/SPONSOR LOGOS/1. ORGANISERS  (EVERYWHERE!)/umushroom_white.png' },
];

export function WelcomeScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const [hosts, setHosts] = useState<PersonProfile[]>([]);

  useEffect(() => {
    const loadHosts = async () => {
      try {
        const response = await fetch(`/api/v1/events/${eventId}/display`);
        const data = await response.json();
        const hostProfiles = (data.profiles || []).filter(
          (p: PersonProfile) => p.profileType === 'SPEAKER' || p.profileType === 'HOST'
        );
        setHosts(hostProfiles.slice(0, 2));
      } catch (error) {
        console.error('Failed to load hosts:', error);
      }
    };
    if (eventId) loadHosts();
  }, [eventId]);

  const displayHosts = hosts.length > 0 ? hosts : [
    { id: '1', name: 'Giorgio Toledo', role: 'Co-Founder', company: 'MCD Edu', profileType: 'HOST' as const },
    { id: '2', name: 'Dr. Luba Schoenig', role: 'Co-Founder', company: 'UMushroom', profileType: 'HOST' as const },
  ];

  return (
    <div className="min-h-screen bg-navy-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Blue gradient sweep */}
        <div 
          className="absolute top-0 right-0 w-[60%] h-full"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(0, 85, 254, 0.12) 50%, rgba(0, 217, 255, 0.08) 100%)',
          }}
        />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-mcd-500/10 rounded-full blur-[150px]"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Welcome Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-7xl font-display mb-4">
            <span className="text-gradient">WELCOME</span>
          </h1>
          <h2 className="text-3xl text-white/90 font-light">
            to the UK University Investment Competition Finals
          </h2>
        </motion.div>

        {/* Hosts Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-24 h-px bg-gradient-to-r from-transparent to-mcd-500/50" />
            <p className="text-lg text-muted-foreground">Your Hosts</p>
            <div className="w-24 h-px bg-gradient-to-r from-mcd-500/50 to-transparent" />
          </div>

          <div className="flex justify-center gap-12">
            {displayHosts.map((host, idx) => (
              <motion.div
                key={host.id}
                initial={{ opacity: 0, x: idx === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.2 }}
                className="text-center"
              >
                {/* Host Photo */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative mb-6"
                >
                  {/* Decorative ring */}
                  <motion.div
                    className="absolute -inset-3 rounded-full border border-mcd-500/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-mcd-500/30 shadow-2xl shadow-mcd-500/10">
                    {host.photoUrl ? (
                      <img
                        src={host.photoUrl}
                        alt={host.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-mcd-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white">
                          {host.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Microphone badge */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                </motion.div>

                {/* Host Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.2 }}
                >
                  <h3 className="text-2xl font-bold mb-1">{host.name}</h3>
                  <p className="text-mcd-400 font-medium">{host.role}</p>
                  {host.company && (
                    <p className="text-muted-foreground">{host.company}</p>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Decorative divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="w-64 h-px bg-gradient-to-r from-transparent via-mcd-500 to-transparent mb-12"
        />

        {/* Partner Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-6">Proudly organised by</p>
          <div className="flex justify-center items-center gap-8">
            {PARTNER_LOGOS.map((partner, idx) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + idx * 0.1 }}
                className="h-12 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
              >
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  className="h-full w-auto object-contain max-w-[140px]"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
