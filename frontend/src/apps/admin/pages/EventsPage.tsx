import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Calendar, MapPin, Trash2, Edit, Eye } from 'lucide-react';
import { eventsApi } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import type { Event } from '@/shared/types';

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', date: '', venue: '' });
  const [isCreating, setIsCreating] = useState(false);
  
  const navigate = useNavigate();

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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const event = await eventsApi.create(newEvent);
      setShowCreateModal(false);
      setNewEvent({ name: '', date: '', venue: '' });
      navigate(`/events/${event.id}`);
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventsApi.delete(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage competition events
          </p>
        </div>
        <Button variant="gold" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first investment competition event
          </p>
          <Button variant="gold" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group"
            >
              {/* Event Header */}
              <div className="h-24 bg-gradient-to-br from-gold-500/20 to-primary/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-display text-white/20">
                    {event.name.charAt(0)}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'LIVE'
                        ? 'bg-green-500 text-white'
                        : event.status === 'COMPLETED'
                        ? 'bg-gold-500 text-navy-950'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{event.name}</h3>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(event.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.venue}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-4 mb-4">
                  <span>{(event as any)._count?.teams || 0} Teams</span>
                  <span>{(event as any)._count?.stages || 0} Stages</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link to={`/events/${event.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCreateModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="UK Investment Challenge 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Date
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Venue (Optional)
                </label>
                <input
                  type="text"
                  value={newEvent.venue}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, venue: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="London, UK"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  className="flex-1"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

