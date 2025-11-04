"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RotateCcw, ChevronLeft, ChevronRight, Star, CheckCircle2, X, Shuffle } from 'lucide-react';
import { toast } from 'sonner';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  mastered: boolean;
}

interface FlashCardsProps {
  flashcardsData?: Flashcard[];
}

export function FlashCards({ flashcardsData }: FlashCardsProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const mockFlashcards: Flashcard[] = [
    {
      id: '1',
      front: 'What is the definition of stereoisomers?',
      back: 'Compounds that have the same molecular formula and connectivity but differ in the spatial arrangement of atoms.',
      difficulty: 'medium',
      category: 'Stereochemistry',
      mastered: false
    },
    {
      id: '2',
      front: 'Name the functional group: -OH',
      back: 'Hydroxyl group (Alcohol)',
      difficulty: 'easy',
      category: 'Functional Groups',
      mastered: true
    },
    {
      id: '3',
      front: 'What is Markovnikov\'s rule?',
      back: 'In the addition of HX to an alkene, the hydrogen atom bonds to the carbon atom that already has the greater number of hydrogen atoms.',
      difficulty: 'hard',
      category: 'Reaction Mechanisms',
      mastered: false
    },
    {
      id: '4',
      front: 'What is the hybridization of carbon in methane (CH₄)?',
      back: 'sp³ hybridization',
      difficulty: 'easy',
      category: 'Molecular Structure',
      mastered: true
    },
    {
      id: '5',
      front: 'Define chirality',
      back: 'A molecule is chiral if it cannot be superimposed on its mirror image.',
      difficulty: 'medium',
      category: 'Stereochemistry',
      mastered: false
    }
  ];

  const currentCard = mockFlashcards[currentIndex];
  const totalCards = mockFlashcards.length;
  const masteredCount = mockFlashcards.filter(card => card.mastered).length;
  const progress = ((currentIndex + 1) / totalCards) * 100;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalCards);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowAnswer(!showAnswer);
  };

  const handleMastered = () => {
    toast.success('Card marked as mastered! 🎉');
    handleNext();
  };

  const handleNeedsReview = () => {
    toast.info('Card added to review pile');
    handleNext();
  };

  const shuffleCards = () => {
    toast.info('Cards shuffled! 🔀');
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-100 text-emerald-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="border-0 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Flashcard Review
              </CardTitle>
              <CardDescription>
                Master your concepts with spaced repetition
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {masteredCount}/{totalCards}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Card {currentIndex + 1} of {totalCards}</span>
            <Button onClick={shuffleCards} variant="outline" size="sm">
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Flashcard */}
      <div className="relative">
        <Card className={`border-0 shadow-xl transition-all duration-500 min-h-[400px] cursor-pointer ${
          isFlipped ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-white/80 backdrop-blur-sm'
        }`} onClick={handleFlip}>
          <CardContent className="p-8 flex flex-col justify-center items-center text-center min-h-[350px]">
            {/* Card Metadata */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="secondary" className={getDifficultyColor(currentCard.difficulty)}>
                {currentCard.difficulty}
              </Badge>
              <Badge variant="outline">
                {currentCard.category}
              </Badge>
              {currentCard.mastered && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mastered
                </Badge>
              )}
            </div>

            {/* Flip Indicator */}
            <div className="absolute top-4 right-4">
              <RotateCcw className={`h-5 w-5 ${isFlipped ? 'text-white/70' : 'text-muted-foreground'}`} />
            </div>

            {/* Card Content */}
            <div className="space-y-6">
              <div className={`text-lg font-medium ${isFlipped ? 'text-white/90' : 'text-muted-foreground'}`}>
                {isFlipped ? 'Answer' : 'Question'}
              </div>
              <div className={`text-2xl font-bold leading-relaxed ${isFlipped ? 'text-white' : 'text-foreground'}`}>
                {isFlipped ? currentCard.back : currentCard.front}
              </div>
              
              {!isFlipped && (
                <div className="text-muted-foreground">
                  Click to reveal answer
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Button
            onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <Button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      {showAnswer && (
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleNeedsReview}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            <X className="h-5 w-5 text-red-500" />
            Need More Review
          </Button>
          <Button
            onClick={handleMastered}
            size="lg"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
          >
            <CheckCircle2 className="h-5 w-5" />
            Got It!
          </Button>
        </div>
      )}

      {/* Study Tips */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-yellow-500 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Study Tip</h3>
              <p className="text-sm text-muted-foreground">
                Use spaced repetition for better retention. Review cards you find difficult more frequently, 
                and gradually increase intervals for mastered concepts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}