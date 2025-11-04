"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, BookOpen, Target, CheckCircle2 } from 'lucide-react';
import Calendar from 'react-calendar';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface StudyEvent {
  id: string;
  date: string;
  title: string;
  duration: string;
  type: 'study' | 'review' | 'quiz' | 'break';
  completed: boolean;
}

interface StudyCalendarProps {
  calendarData?: StudyEvent[];
}

export function StudyCalendar({ calendarData }: StudyCalendarProps = {}) {
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  
  const mockEvents: StudyEvent[] = [
    {
      id: '1',
      date: new Date().toDateString(),
      title: 'Organic Reactions Review',
      duration: '60 min',
      type: 'study',
      completed: true
    },
    {
      id: '2',
      date: new Date().toDateString(),
      title: 'Nomenclature Quiz',
      duration: '30 min',
      type: 'quiz',
      completed: true
    },
    {
      id: '3',
      date: new Date().toDateString(),
      title: 'Stereochemistry Deep Dive',
      duration: '90 min',
      type: 'study',
      completed: false
    },
    {
      id: '4',
      date: new Date(Date.now() + 86400000).toDateString(),
      title: 'Functional Groups Flashcards',
      duration: '45 min',
      type: 'review',
      completed: false
    },
    {
      id: '5',
      date: new Date(Date.now() + 86400000).toDateString(),
      title: 'Practice Exam #1',
      duration: '120 min',
      type: 'quiz',
      completed: false
    }
  ];

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => event.date === date.toDateString());
  };

  const selectedDateEvents = selectedDate instanceof Date ? getEventsForDate(selectedDate) : [];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-emerald-100 text-emerald-800';
      case 'quiz': return 'bg-purple-100 text-purple-800';
      case 'break': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'study': return BookOpen;
      case 'review': return CheckCircle2;
      case 'quiz': return Target;
      case 'break': return Clock;
      default: return BookOpen;
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2 border-0 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Study Schedule
          </CardTitle>
          <CardDescription>
            Your personalized daily study plan leading to exam success
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="mx-auto"
            tileContent={({ date, view }) => {
              if (view === 'month') {
                const events = getEventsForDate(date);
                if (events.length > 0) {
                  return (
                    <div className="flex justify-center mt-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  );
                }
              }
              return null;
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      <Card className="border-0 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate instanceof Date 
              ? selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })
              : 'Select a date'
            }
          </CardTitle>
          <CardDescription>
            {selectedDateEvents.length} study sessions planned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => {
                const IconComponent = getEventTypeIcon(event.type);
                return (
                  <div key={event.id} className="p-3 rounded-lg bg-white/50 border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{event.title}</span>
                      </div>
                      {event.completed && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getEventTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.duration}
                        </span>
                      </div>
                      {!event.completed && (
                        <Button size="sm" variant="outline" className="h-6 text-xs">
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No study sessions planned for this date</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Add Session
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}