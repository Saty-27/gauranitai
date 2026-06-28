import React, { useState } from 'react';
import ReactCalendar from 'react-calendar';
import { Clock, MapPin, User, Plus, Calendar } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

interface Event {
  id: string;
  title: string;
  time: string;
  type: 'delivery' | 'meeting' | 'maintenance' | 'order';
  location?: string;
  attendee?: string;
}

const mockEvents: Record<string, Event[]> = {
  '2025-08-22': [
    { id: '1', title: 'Morning Delivery Route', time: '06:00', type: 'delivery', location: 'Zone A', attendee: 'Ramesh Kumar' },
    { id: '2', title: 'Vendor Meeting', time: '10:30', type: 'meeting', location: 'Office', attendee: 'Nandini Dairy' },
    { id: '3', title: 'Equipment Check', time: '14:00', type: 'maintenance', location: 'Warehouse' },
  ],
  '2025-08-23': [
    { id: '4', title: 'Large Order Delivery', time: '08:00', type: 'order', location: 'Corporate Office', attendee: 'ABC Company' },
    { id: '5', title: 'Quality Inspection', time: '11:00', type: 'maintenance', location: 'Processing Unit' },
  ],
  '2025-08-24': [
    { id: '6', title: 'Weekend Route', time: '07:00', type: 'delivery', location: 'Zone B & C', attendee: 'Suresh Patel' },
  ],
};

const eventTypeColors = {
  delivery: 'bg-blue-100 text-blue-800 border-blue-200',
  meeting: 'bg-purple-100 text-purple-800 border-purple-200',
  maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
  order: 'bg-green-100 text-green-800 border-green-200',
};

const eventTypeIcons = {
  delivery: <Truck className="w-4 h-4" />,
  meeting: <Users className="w-4 h-4" />, 
  maintenance: <Wrench className="w-4 h-4" />,
  order: <Package className="w-4 h-4" />,
};

// Import missed truck/users/wrench/package icons
import { Truck, Users, Wrench, Package } from 'lucide-react';

export function CalendarWidget() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateString = selectedDate.toISOString().split('T')[0];
  const eventsForDate = mockEvents[dateString] || [];

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = mockEvents[dateStr];
      if (dayEvents && dayEvents.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100" data-testid="calendar-widget">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Schedule & Events</h3>
        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-testid="add-event">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ring-1 ring-gray-100 p-1 rounded-xl">
        {/* Calendar Section */}
        <div className="bg-gray-50/50 p-4 rounded-xl">
          <div className="calendar-container">
            <style>{`
              .react-calendar {
                width: 100%;
                background: transparent;
                border: none;
                font-family: 'Inter', sans-serif;
              }
              .react-calendar__tile {
                background: transparent;
                border: none;
                padding: 0.75rem 0.5rem;
                font-size: 0.875rem;
                border-radius: 0.5rem;
                transition: all 0.2s;
              }
              .react-calendar__tile:hover {
                background-color: white;
                color: rgb(59 130 246);
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              }
              .react-calendar__tile--active {
                background-color: rgb(59 130 246) !important;
                color: white !important;
                box-shadow: 0 10px 15px -3px rgb(59 130 246 / 0.3);
              }
              .react-calendar__tile--now {
                background-color: rgb(254 240 138);
                color: rgb(146 64 14);
              }
              .react-calendar__navigation button {
                background: transparent;
                border: none;
                color: rgb(75 85 99);
                font-size: 1rem;
                font-weight: 600;
                padding: 0.5rem;
                border-radius: 0.5rem;
                transition: all 0.2s;
              }
              .react-calendar__navigation button:hover {
                background-color: white;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
              }
              .react-calendar__month-view__weekdays {
                text-align: center;
                font-weight: 600;
                font-size: 0.75rem;
                color: rgb(107 114 128);
                margin-bottom: 0.5rem;
              }
              .react-calendar__month-view__weekdays__weekday {
                padding: 0.5rem;
              }
            `}</style>
            <ReactCalendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              tileContent={tileContent}
              data-testid="calendar"
            />
          </div>
        </div>

        {/* Selected Day View */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h4 className="font-bold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </h4>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">
              {eventsForDate.length} Events
            </span>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {eventsForDate.length > 0 ? (
              eventsForDate.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-xl border-l-4 border shadow-sm ${eventTypeColors[event.type]} animation-fade-in`}
                  data-testid={`event-${event.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {eventTypeIcons[event.type]}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h5 className="font-bold text-sm tracking-tight">{event.title}</h5>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] sm:text-xs">
                        <div className="flex items-center space-x-1 font-medium italic">
                          <Clock className="w-3 h-3" />
                          <span>{event.time}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-1 opacity-70">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.attendee && (
                          <div className="flex items-center space-x-1 opacity-70">
                            <User className="w-3 h-3" />
                            <span className="truncate">{event.attendee}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">Clear Schedule</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Nothing planned</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}