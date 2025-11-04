"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Lightbulb, Target, CheckCircle2, Star, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface StudyTopic {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time: string;
  mastered: boolean;
}

interface Definition {
  term: string;
  definition: string;
  example?: string;
}

interface StudyGuideData {
  courseTitle: string;
  summary: string;
  keyLearningObjectives: string[];
  studyStrategy: string;
  examTips: string[];
  topics: StudyTopic[];
  definitions: Definition[];
}

interface StudyGuideProps {
  studyGuideData?: StudyGuideData;
}

export function StudyGuide({ studyGuideData }: StudyGuideProps = {}) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const mockTopics: StudyTopic[] = [
    {
      id: '1',
      title: 'Stereochemistry Fundamentals',
      summary: 'Understanding the three-dimensional arrangement of atoms in molecules and how this affects chemical properties and reactions.',
      keyPoints: [
        'Chirality and stereoisomers',
        'R/S nomenclature system',
        'Optical activity and polarized light',
        'Racemic mixtures and resolution'
      ],
      difficulty: 'hard',
      estimated_time: '90 minutes',
      mastered: false
    },
    {
      id: '2',
      title: 'Functional Groups',
      summary: 'Identification and properties of common organic functional groups that determine molecular behavior and reactivity.',
      keyPoints: [
        'Alcohols, ethers, and phenols',
        'Aldehydes and ketones',
        'Carboxylic acids and derivatives',
        'Amines and amides'
      ],
      difficulty: 'easy',
      estimated_time: '45 minutes',
      mastered: true
    },
    {
      id: '3',
      title: 'Reaction Mechanisms',
      summary: 'Step-by-step processes showing how chemical bonds are broken and formed during organic reactions.',
      keyPoints: [
        'Nucleophilic substitution (SN1 vs SN2)',
        'Elimination reactions (E1 vs E2)',
        'Addition reactions to alkenes',
        'Electrophilic aromatic substitution'
      ],
      difficulty: 'hard',
      estimated_time: '120 minutes',
      mastered: false
    },
    {
      id: '4',
      title: 'Molecular Structure and Bonding',
      summary: 'Understanding how atoms bond together to form organic molecules and the resulting molecular shapes.',
      keyPoints: [
        'Hybridization (sp, sp², sp³)',
        'Molecular geometry and VSEPR theory',
        'Resonance structures',
        'Intermolecular forces'
      ],
      difficulty: 'medium',
      estimated_time: '60 minutes',
      mastered: true
    }
  ];

  const mockDefinitions: Definition[] = [
    {
      term: 'Chirality',
      definition: 'A property of molecules that cannot be superimposed on their mirror images.',
      example: 'Amino acids (except glycine) are chiral molecules with four different groups attached to the central carbon.'
    },
    {
      term: 'Stereoisomers',
      definition: 'Compounds with the same molecular formula and connectivity but different spatial arrangements of atoms.',
      example: 'D-glucose and L-glucose are stereoisomers that are mirror images of each other.'
    },
    {
      term: 'Nucleophile',
      definition: 'An electron-rich species that donates an electron pair to form a new chemical bond.',
      example: 'Hydroxide ion (OH⁻) and ammonia (NH₃) are common nucleophiles.'
    },
    {
      term: 'Electrophile',
      definition: 'An electron-deficient species that accepts an electron pair to form a new chemical bond.',
      example: 'Carbocations (R₃C⁺) and hydrogen ions (H⁺) are common electrophiles.'
    },
    {
      term: 'Resonance',
      definition: 'The delocalization of electrons in molecules that cannot be represented by a single Lewis structure.',
      example: 'Benzene has resonance structures showing electron delocalization around the ring.'
    }
  ];

  const handleTopicMastery = (topicId: string) => {
    toast.success('Topic marked as mastered! 🎉');
  };

  const exportStudyGuide = () => {
    toast.success('Study guide exported! 📄');
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
      {/* Header */}
      <Card className="border-0 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Organic Chemistry Study Guide
              </CardTitle>
              <CardDescription>
                AI-generated comprehensive study materials for your exam
              </CardDescription>
            </div>
            <Button onClick={exportStudyGuide} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="topics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm">
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Topics
          </TabsTrigger>
          <TabsTrigger value="definitions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Key Terms
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <div className="grid gap-6">
            {mockTopics.map((topic) => (
              <Card key={topic.id} className="border-0 bg-white/60 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{topic.title}</CardTitle>
                        {topic.mastered && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mastered
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getDifficultyColor(topic.difficulty)}>
                          {topic.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {topic.estimated_time}
                        </Badge>
                      </div>
                    </div>
                    {!topic.mastered && (
                      <Button 
                        onClick={() => handleTopicMastery(topic.id)}
                        variant="outline"
                        size="sm"
                      >
                        Mark as Mastered
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {topic.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Key Learning Points
                    </h4>
                    <ul className="space-y-2">
                      {topic.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="definitions">
          <Card className="border-0 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Essential Definitions
              </CardTitle>
              <CardDescription>
                Master these key terms to build a strong foundation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {mockDefinitions.map((def, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      <span className="font-semibold">{def.term}</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-muted-foreground">
                        {def.definition}
                      </p>
                      {def.example && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm">
                            <strong>Example:</strong> {def.example}
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="border-0 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Course Summary
              </CardTitle>
              <CardDescription>
                High-level overview of all major concepts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <h3>Organic Chemistry Overview</h3>
                <p>
                  Organic chemistry is the study of carbon-containing compounds and their reactions. 
                  This course covers fundamental concepts including molecular structure, stereochemistry, 
                  functional groups, and reaction mechanisms.
                </p>

                <h3>Key Learning Objectives</h3>
                <ul>
                  <li>Understand three-dimensional molecular structure and stereochemistry</li>
                  <li>Identify and predict properties of functional groups</li>
                  <li>Analyze reaction mechanisms and predict products</li>
                  <li>Apply knowledge to solve complex synthetic problems</li>
                </ul>

                <h3>Study Strategy</h3>
                <p>
                  Focus on understanding concepts rather than memorization. Practice drawing structures, 
                  work through mechanism problems step-by-step, and use molecular models to visualize 
                  three-dimensional relationships.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-900">Exam Success Tips</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Practice drawing structures and mechanisms daily</li>
                  <li>• Use flashcards for functional group recognition</li>
                  <li>• Work through practice problems under timed conditions</li>
                  <li>• Form study groups to discuss challenging concepts</li>
                  <li>• Review your mistakes and understand the correct reasoning</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}