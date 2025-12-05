import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/shared/hooks/useSocket';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { useTimer } from '@/shared/hooks/useTimer';
import { LobbyScreen } from '../components/screens/LobbyScreen';
import { TeamCardGridScreen } from '../components/screens/TeamCardGridScreen';
import { WelcomeScreen } from '../components/screens/WelcomeScreen';
import { JuryRevealScreen } from '../components/screens/JuryRevealScreen';
import { KeynoteScreen } from '../components/screens/KeynoteScreen';
import { RoundScreen } from '../components/screens/RoundScreen';
import { TransitionScreen } from '../components/screens/TransitionScreen';
import { BreakScreen } from '../components/screens/BreakScreen';
import { AwardsScreen } from '../components/screens/AwardsScreen';
import { NetworkingScreen } from '../components/screens/NetworkingScreen';

export function AudienceScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const { connectionState } = useSocket({
    eventId: eventId!,
    clientType: 'audience',
  });

  const { state } = useLiveStateStore();
  const timer = useTimer(state?.timerState || null);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Connecting to event...</p>
        </motion.div>
      </div>
    );
  }

  const renderScreen = () => {
    const stageType = state.currentStage?.stageType;

    switch (stageType) {
      case 'LOBBY':
        return <LobbyScreen />;
      case 'LOBBY_CARD_GRID':
        return <TeamCardGridScreen />;
      case 'WELCOME':
        return <WelcomeScreen />;
      case 'JURY_REVEAL':
        return <JuryRevealScreen />;
      case 'KEYNOTE':
        return <KeynoteScreen />;
      case 'ROUND':
        return <RoundScreen timer={timer} />;
      case 'TEAM_TRANSITION':
        return <TransitionScreen />;
      case 'BREAK':
        return <BreakScreen timer={timer} />;
      case 'AWARDS':
        return <AwardsScreen />;
      case 'NETWORKING':
        return <NetworkingScreen />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-navy-950">
            <div className="text-center">
              <h1 className="text-5xl font-display text-gradient mb-4">
                UK INVESTMENT CHALLENGE
              </h1>
              <p className="text-xl text-muted-foreground">
                {state.currentStage?.title || 'Waiting for event to start...'}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fullscreen-mode bg-navy-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentStage?.id || 'default'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {/* Connection indicator (subtle) */}
      {!connectionState.isConnected && (
        <div className="fixed bottom-4 right-4 px-3 py-2 bg-red-500/80 rounded-lg text-white text-sm">
          {connectionState.isReconnecting ? 'Reconnecting...' : 'Disconnected'}
        </div>
      )}
    </div>
  );
}

