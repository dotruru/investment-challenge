import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Award, Plus } from 'lucide-react';
import { eventsApi } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import type { Event } from '@/shared/types';

export function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.list();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingEvents = events.filter(
    (e) => e.status === 'DRAFT' || e.status === 'CONFIGURED'
  );
  const liveEvents = events.filter((e) => e.status === 'LIVE');
  const completedEvents = events.filter((e) => e.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your investment competition events
          </p>
        </div>
        <Link to="/events">
          <Button variant="gold">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Upcoming Events</p>
              <p className="text-2xl font-bold">{upcomingEvents.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Live Now</p>
              <p className="text-2xl font-bold">{liveEvents.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold-500/10 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Completed</p>
              <p className="text-2xl font-bold">{completedEvents.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Events */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No events yet</p>
            <Link to="/events">
              <Button variant="outline">Create your first event</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.slice(0, 5).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/events/${event.id}`}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center text-navy-950 font-bold">
                      {event.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {event.venue && ` • ${event.venue}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === 'LIVE'
                          ? 'bg-green-500/10 text-green-500'
                          : event.status === 'COMPLETED'
                          ? 'bg-gold-500/10 text-gold-500'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

