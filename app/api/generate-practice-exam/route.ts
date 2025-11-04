import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { extractTextFromFile, validateFileType, validateFileSize } from '@/lib/file-processors';

const PRACTICE_EXAM_SYSTEM_PROMPT = `You are an expert educational AI that creates comprehensive practice exams. Your task is to analyze the provided content and generate a structured JSON response containing exam questions.

CRITICAL: You must return ONLY valid JSON that matches the exact schema provided. Do not include any explanatory text, markdown formatting, or additional commentary outside the JSON structure.

The JSON response must include an array of exam questions with:
1. Multiple choice questions (4 options each)
2. Detailed explanations for correct answers
3. Appropriate difficulty levels
4. Point values based on difficulty
5. Category classifications

Ensure all content is:
- Academically accurate and well-structured
- Appropriate for the specified difficulty level
- Comprehensive coverage of the provided material
- Realistic exam-style questions`;

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    
    // Extract form fields
    const examType = formData.get('examType') as string;
    const courseName = formData.get('courseName') as string;
    const examDuration = parseInt(formData.get('examDuration') as string);
    const questionCount = parseInt(formData.get('questionCount') as string);
    const difficulty = formData.get('difficulty') as string;
    const topics = formData.get('topics') as string;
    const pastedContent = formData.get('content') as string;
    const file = formData.get('file') as File | null;

    // Validate required fields
    if (!courseName || !examType) {
      return NextResponse.json(
        { error: 'Missing required fields: courseName or examType' },
        { status: 400 }
      );
    }

    // Extract content from file or use pasted content
    let examContent = '';
    
    if (file && file.size > 0) {
      // Validate file
      if (!validateFileType(file)) {
        return NextResponse.json(
          { error: 'Invalid file type. Please upload PDF, DOCX, TXT, or MD files only.' },
          { status: 400 }
        );
      }
      
      if (!validateFileSize(file)) {
        return NextResponse.json(
          { error: 'File too large. Please upload files smaller than 10MB.' },
          { status: 400 }
        );
      }

      try {
        examContent = await extractTextFromFile(file);
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to process the uploaded file. Please try again or paste the content directly.' },
          { status: 400 }
        );
      }
    } else if (pastedContent && pastedContent.trim()) {
      examContent = pastedContent.trim();
    } else {
      return NextResponse.json(
        { error: 'Please provide content either by uploading a file or pasting content.' },
        { status: 400 }
      );
    }

    // Validate content length
    if (examContent.length < 200) {
      return NextResponse.json(
        { error: 'Content is too short. Please provide more comprehensive content (at least 200 characters).' },
        { status: 400 }
      );
    }

    if (examContent.length > 50000) {
      // Truncate if too long to avoid token limits
      examContent = examContent.substring(0, 50000) + '... [Content truncated for processing]';
    }

    // Create the user prompt based on exam type
    const examTypeInstruction = examType === 'similar-exam' 
      ? 'Analyze the provided exam and create similar questions with different content but maintaining the same style, difficulty, and question types.'
      : 'Analyze the provided study material and create comprehensive exam questions covering all key concepts.';

    const userPrompt = `
${examTypeInstruction}

**Exam Configuration:**
- Course: ${courseName}
- Duration: ${examDuration} minutes
- Number of Questions: ${questionCount}
- Difficulty Distribution: ${difficulty}
- Focus Topics: ${topics || 'Cover all material comprehensively'}
- Exam Type: ${examType === 'similar-exam' ? 'Similar to provided exam' : 'Content-based generation'}

**Content to Analyze:**
${examContent}

**Requirements:**
1. Generate exactly ${questionCount} multiple choice questions
2. Each question must have exactly 4 options
3. Distribute difficulty levels according to: ${difficulty}
4. Assign point values: easy (1 point), medium (2 points), hard (3 points)
5. Create realistic, exam-appropriate questions
6. Provide detailed explanations for correct answers
7. Categorize questions by topic/subject area

Return ONLY a valid JSON object with this exact schema:
{
  "questions": [
    {
      "id": "string (unique identifier)",
      "question": "string (the question text)",
      "options": ["string array of exactly 4 options"],
      "correctAnswer": "number (0-3, index of correct option)",
      "explanation": "string (detailed explanation of why the answer is correct)",
      "difficulty": "easy|medium|hard",
      "category": "string (topic/subject category)",
      "points": "number (1 for easy, 2 for medium, 3 for hard)"
    }
  ]
}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: PRACTICE_EXAM_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    // Parse and validate the JSON response
    let examData: { questions: ExamQuestion[] };
    try {
      examData = JSON.parse(responseContent);
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

    // Basic validation of the response structure
    if (!examData.questions || !Array.isArray(examData.questions)) {
      throw new Error('Invalid exam structure - missing questions array');
    }

    if (examData.questions.length === 0) {
      throw new Error('No questions generated');
    }

    // Validate each question structure
    for (const question of examData.questions) {
      if (!question.id || !question.question || !question.options || 
          !Array.isArray(question.options) || question.options.length !== 4 ||
          typeof question.correctAnswer !== 'number' || 
          question.correctAnswer < 0 || question.correctAnswer > 3) {
        throw new Error('Invalid question structure detected');
      }
    }

    return NextResponse.json({
      success: true,
      data: examData.questions,
      metadata: {
        examType,
        courseName,
        examDuration,
        questionCount: examData.questions.length,
        difficulty,
        contentLength: examContent.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API configuration error. Please check your API key.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to generate practice exam. Please try again.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}