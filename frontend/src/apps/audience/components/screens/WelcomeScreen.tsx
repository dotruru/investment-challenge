import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import type { PersonProfile } from '@/shared/types';

// Partner logos
const PARTNER_LOGOS = [
  { name: 'MCD Edu', color: 'from-blue-400 to-blue-600' },
  { name: 'Umushroom', color: 'from-green-400 to-green-600' },
  { name: 'Bloomberg', color: 'from-orange-400 to-orange-600' },
  { name: 'CFA UK', color: 'from-purple-400 to-purple-600' },
];

export function WelcomeScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const [hosts, setHosts] = useState<PersonProfile[]>([]);

  useEffect(() => {
    const loadHosts = async () => {
      try {
        const response = await fetch(`/api/v1/events/${eventId}/display`);
        const data = await response.json();
        // Filter for speakers/hosts - in production, might have a HOST type
        const hostProfiles = (data.profiles || []).filter(
          (p: PersonProfile) => p.profileType === 'SPEAKER' || p.profileType === 'HOST'
        );
        setHosts(hostProfiles.slice(0, 2)); // Get first 2 as hosts
      } catch (error) {
        console.error('Failed to load hosts:', error);
      }
    };
    if (eventId) loadHosts();
  }, [eventId]);

  // Default hosts if none loaded from API
  const displayHosts = hosts.length > 0 ? hosts : [
    { id: '1', name: 'Giorgio Romano', role: 'Co-founder', company: 'MCD Edu', profileType: 'HOST' as const },
    { id: '2', name: 'Luba Schwartzman', role: 'Co-founder', company: 'Umushroom', profileType: 'HOST' as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gold-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Welcome Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-7xl font-display text-gradient mb-4">
            WELCOME
          </h1>
          <h2 className="text-3xl text-white/90 font-light">
            to the UK Investment Challenge Finals
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
            <div className="w-24 h-px bg-gradient-to-r from-transparent to-gold-500/50" />
            <p className="text-lg text-muted-foreground">Your Hosts</p>
            <div className="w-24 h-px bg-gradient-to-r from-gold-500/50 to-transparent" />
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
                    className="absolute -inset-3 rounded-full border border-gold-500/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gold-500/30 shadow-2xl shadow-gold-500/10">
                    {host.photoUrl ? (
                      <img
                        src={host.photoUrl}
                        alt={host.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                        <span className="text-5xl font-bold text-navy-950">
                          {host.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Microphone badge */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center shadow-lg">
                    <Mic className="w-5 h-5 text-navy-950" />
                  </div>
                </motion.div>

                {/* Host Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.2 }}
                >
                  <h3 className="text-2xl font-bold mb-1">{host.name}</h3>
                  <p className="text-gold-400 font-medium">{host.role}</p>
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
          className="w-64 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mb-12"
        />

        {/* Partner Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-6">Proudly supported by</p>
          <div className="flex justify-center items-center gap-6">
            {PARTNER_LOGOS.map((partner, idx) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + idx * 0.1 }}
                className={`w-28 h-12 bg-gradient-to-br ${partner.color} rounded-lg flex items-center justify-center shadow-lg opacity-80 hover:opacity-100 transition-opacity`}
              >
                <span className="font-bold text-white text-xs">{partner.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
