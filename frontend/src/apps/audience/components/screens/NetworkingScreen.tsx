import { motion } from 'framer-motion';
import { Wine, Users, MessageCircle, QrCode, Heart, Sparkles } from 'lucide-react';

const PARTNER_LOGOS = [
  { name: 'MCD Edu', logo: '/assets/DATAROOM/SPONSOR LOGOS/1. ORGANISERS  (EVERYWHERE!)/MCD - White.png' },
  { name: 'UMushroom', logo: '/assets/DATAROOM/SPONSOR LOGOS/1. ORGANISERS  (EVERYWHERE!)/umushroom_white.png' },
];

export function NetworkingScreen() {
  return (
    <div className="min-h-screen bg-navy-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-[60%] h-full"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(0, 85, 254, 0.12) 50%, rgba(0, 217, 255, 0.08) 100%)',
          }}
        />
        
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-mcd-500/10 rounded-full blur-[150px]"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-mcd-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Thank You Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <Sparkles className="w-10 h-10 text-mcd-400" />
            <Heart className="w-8 h-8 text-red-400" />
            <Sparkles className="w-10 h-10 text-cyan-400" />
          </motion.div>
          
          <h1 className="text-7xl font-display mb-4">
            <span className="text-gradient">THANK YOU</span>
          </h1>
          <h2 className="text-3xl text-white/90 font-light">
            for joining the UK Investment Competition Finals!
          </h2>
        </motion.div>

        {/* Networking Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-8 mb-16 max-w-4xl"
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-navy-800/50 backdrop-blur border border-mcd-500/20 rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-mcd-500/20 rounded-full flex items-center justify-center">
              <Wine className="w-8 h-8 text-mcd-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Apéro & Drinks</h3>
            <p className="text-muted-foreground text-sm">
              Head downstairs for refreshments and networking
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-navy-800/50 backdrop-blur border border-cyan-500/20 rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Meet the Teams</h3>
            <p className="text-muted-foreground text-sm">
              Connect with participants, judges, and partners
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-navy-800/50 backdrop-blur border border-green-500/20 rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Share Feedback</h3>
            <p className="text-muted-foreground text-sm">
              We'd love to hear your thoughts on today's event
            </p>
          </motion.div>
        </motion.div>

        {/* QR Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-8 mb-16"
        >
          <div className="bg-navy-800/50 border border-white/10 rounded-xl p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-3 bg-white rounded-lg flex items-center justify-center">
              <QrCode className="w-16 h-16 text-navy-950" />
            </div>
            <p className="text-sm text-muted-foreground">Feedback Form</p>
          </div>
          <div className="bg-navy-800/50 border border-white/10 rounded-xl p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-3 bg-white rounded-lg flex items-center justify-center">
              <QrCode className="w-16 h-16 text-navy-950" />
            </div>
            <p className="text-sm text-muted-foreground">Platform Sign-up</p>
          </div>
        </motion.div>

        {/* Partner Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-6">
            Special thanks to our partners and organisers
          </p>
          <div className="flex justify-center items-center gap-8">
            {PARTNER_LOGOS.map((partner, idx) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + idx * 0.1 }}
                className="h-12 flex items-center justify-center"
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

        {/* Footer message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 text-muted-foreground text-sm"
        >
          See you next year! 🎉
        </motion.p>
      </div>
    </div>
  );
}
