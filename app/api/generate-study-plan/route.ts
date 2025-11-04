import { NextRequest, NextResponse } from 'next/server';
import { openai, STUDY_PLAN_SYSTEM_PROMPT, StudyPlanSchema } from '@/lib/openai';
import { extractTextFromMultipleFiles, validateFileType, validateFileSize, validateTotalFileSize } from '@/lib/file-processors';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface OutputSelection {
  studyGuide: boolean;
  studyPlan: boolean;
  flashcards: boolean;
  practiceQuestions: boolean;
  practiceExam: boolean;
  formulaSheets: boolean;
  homeworkFeedback: boolean;
  questionCount: number;
  flashcardCount: number;
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors from setting cookies
            }
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to generate study materials.' },
        { status: 401 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    
    // Extract form fields
    const courseName = formData.get('courseName') as string;
    const examDate = formData.get('examDate') as string;
    const topics = formData.get('topics') as string;
    const studyHoursPerDay = parseInt(formData.get('studyHoursPerDay') as string);
    const preparednessLevel = formData.get('preparednessLevel') as string;
    const pastedContent = formData.get('pastedContent') as string;
    const outputSelectionStr = formData.get('outputSelection') as string;

    // Get user profile to determine tier
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const userTier = userProfile?.subscription_tier || 'free';

    // Parse output selection
    let outputSelection: OutputSelection;
    try {
      outputSelection = JSON.parse(outputSelectionStr || '{}');
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid output selection format' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!courseName || !examDate || !preparednessLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: courseName, examDate, or preparednessLevel' },
        { status: 400 }
      );
    }

    // Check if any outputs are selected
    const hasSelectedOutputs = Object.entries(outputSelection).some(([key, value]) => 
      key !== 'questionCount' && key !== 'flashcardCount' && value === true
    );

    if (!hasSelectedOutputs) {
      return NextResponse.json(
        { error: 'Please select at least one output type' },
        { status: 400 }
      );
    }

    // Extract files from form data
    const files: File[] = [];
    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
      if (key.startsWith('file-') && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    // Validate files based on user tier
    const maxFiles = userTier === 'pro' ? 25 : userTier === 'basic' ? 10 : 3;
    const maxFileSize = userTier === 'pro' ? 100 : userTier === 'basic' ? 25 : 5; // MB
    const maxTotalSize = userTier === 'pro' ? 200 : userTier === 'basic' ? 50 : 10; // MB

    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} files allowed for ${userTier} plan` },
        { status: 400 }
      );
    }

    // Validate individual file types and sizes
    for (const file of files) {
      if (!validateFileType(file)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Please upload PDF, DOCX, PPTX, TXT, or MD files only.` },
          { status: 400 }
        );
      }
      
      if (!validateFileSize(file, maxFileSize)) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size: ${maxFileSize}MB for ${userTier} plan.` },
          { status: 400 }
        );
      }
    }

    // Validate total file size
    if (!validateTotalFileSize(files, maxTotalSize)) {
      return NextResponse.json(
        { error: `Total file size exceeds ${maxTotalSize}MB limit for ${userTier} plan.` },
        { status: 400 }
      );
    }

    // Extract content from files or use pasted content
    let studyMaterial = '';
    
    if (files.length > 0) {
      try {
        studyMaterial = await extractTextFromMultipleFiles(files);
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to process uploaded files. Please try again or paste the content directly.' },
          { status: 400 }
        );
      }
    }

    // Append pasted content if provided
    if (pastedContent && pastedContent.trim()) {
      if (studyMaterial) {
        studyMaterial += '\n\n--- Pasted Content ---\n' + pastedContent.trim();
      } else {
        studyMaterial = pastedContent.trim();
      }
    }

    if (!studyMaterial) {
      return NextResponse.json(
        { error: 'Please provide study material either by uploading files or pasting content.' },
        { status: 400 }
      );
    }

    // Validate content length
    if (studyMaterial.length < 100) {
      return NextResponse.json(
        { error: 'Study material is too short. Please provide more comprehensive content (at least 100 characters).' },
        { status: 400 }
      );
    }

    if (studyMaterial.length > 100000) {
      // Truncate if too long to avoid token limits
      studyMaterial = studyMaterial.substring(0, 100000) + '... [Content truncated for processing]';
    }

    // Calculate days until exam
    const examDateObj = new Date(examDate);
    const today = new Date();
    const daysUntilExam = Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Create the user prompt based on selected outputs
    const selectedOutputsList = [];
    if (outputSelection.studyGuide) selectedOutputsList.push('Study Guide with topics and definitions');
    if (outputSelection.studyPlan) selectedOutputsList.push('Study Calendar with daily tasks');
    if (outputSelection.flashcards) selectedOutputsList.push(`${outputSelection.flashcardCount} Flashcards`);
    if (outputSelection.practiceQuestions) selectedOutputsList.push(`${outputSelection.questionCount} Practice Questions`);
    if (outputSelection.practiceExam) selectedOutputsList.push('Full Practice Exam (50+ questions)');
    if (outputSelection.formulaSheets) selectedOutputsList.push('Formula Sheets');
    if (outputSelection.homeworkFeedback) selectedOutputsList.push('Homework Feedback Analysis');

    const userPrompt = `
Please analyze the following study material and create the requested study materials:

**Course Information:**
- Course Name: ${courseName}
- Exam Date: ${examDate} (${daysUntilExam} days from now)
- Additional Topics: ${topics || 'None specified'}
- Study Hours Per Day: ${studyHoursPerDay}
- Preparedness Level: ${preparednessLevel}
- User Tier: ${userTier}

**Requested Outputs:**
${selectedOutputsList.map(item => `- ${item}`).join('\n')}

**Study Material:**
${studyMaterial}

**Requirements:**
1. Generate ONLY the requested components based on the output selection
2. For flashcards: Create exactly ${outputSelection.flashcardCount} cards if selected
3. For practice questions: Create exactly ${outputSelection.questionCount} questions if selected
4. For study calendar: Create daily tasks leading up to the exam if selected
5. Adjust difficulty and content based on the preparedness level: ${preparednessLevel}
6. Consider the available study time: ${studyHoursPerDay} hours per day
7. For ${userTier} tier users, provide appropriate depth and complexity

Return ONLY a valid JSON object matching this exact schema (include only selected components):
{
  ${outputSelection.studyGuide ? `"studyGuide": {
    "courseTitle": "string",
    "summary": "string (2-3 sentences about the course)",
    "keyLearningObjectives": ["string array of 3-5 objectives"],
    "studyStrategy": "string (personalized strategy based on preparedness level)",
    "examTips": ["string array of 3-5 practical exam tips"],
    "topics": [
      {
        "id": "string (unique identifier)",
        "title": "string",
        "summary": "string (2-3 sentences)",
        "keyPoints": ["string array of 3-5 key points"],
        "difficulty": "easy|medium|hard",
        "estimated_time": "string (e.g., '60 minutes')",
        "mastered": false
      }
    ],
    "definitions": [
      {
        "term": "string",
        "definition": "string",
        "example": "string (optional but preferred)"
      }
    ]
  },` : ''}
  ${outputSelection.flashcards ? `"flashcards": [
    {
      "id": "string (unique identifier)",
      "front": "string (question or term)",
      "back": "string (answer or definition)",
      "difficulty": "easy|medium|hard",
      "category": "string (topic category)",
      "mastered": false
    }
  ],` : ''}
  ${outputSelection.practiceQuestions ? `"quizQuestions": [
    {
      "id": "string (unique identifier)",
      "question": "string",
      "options": ["string array of exactly 4 options"],
      "correctAnswer": "number (0-3, index of correct option)",
      "explanation": "string (why the answer is correct)",
      "difficulty": "easy|medium|hard",
      "category": "string (topic category)"
    }
  ],` : ''}
  ${outputSelection.studyPlan ? `"studyCalendar": [
    {
      "id": "string (unique identifier)",
      "date": "string (YYYY-MM-DD format)",
      "title": "string (task description)",
      "duration": "string (e.g., '45 min')",
      "type": "study|review|quiz|break",
      "completed": false
    }
  ],` : ''}
  ${outputSelection.formulaSheets ? `"formulaSheets": [
    {
      "id": "string (unique identifier)",
      "title": "string (formula category)",
      "formulas": [
        {
          "name": "string (formula name)",
          "formula": "string (mathematical expression)",
          "description": "string (when to use)",
          "variables": ["string array of variable definitions"]
        }
      ]
    }
  ],` : ''}
  ${outputSelection.practiceExam ? `"practiceExam": {
    "title": "string",
    "duration": "number (minutes)",
    "totalQuestions": "number",
    "questions": [
      {
        "id": "string (unique identifier)",
        "question": "string",
        "options": ["string array of exactly 4 options"],
        "correctAnswer": "number (0-3, index of correct option)",
        "explanation": "string (detailed explanation)",
        "difficulty": "easy|medium|hard",
        "category": "string (topic category)",
        "points": "number (1 for easy, 2 for medium, 3 for hard)"
      }
    ]
  },` : ''}
  ${outputSelection.homeworkFeedback ? `"homeworkFeedback": {
    "overallAssessment": "string (general performance analysis)",
    "strengthAreas": ["string array of topics student excels in"],
    "weaknessAreas": ["string array of topics needing improvement"],
    "studyRecommendations": ["string array of specific study suggestions"],
    "focusTopics": ["string array of priority topics for review"]
  }` : ''}
}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: STUDY_PLAN_SYSTEM_PROMPT
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
    let studyMaterials: any;
    try {
      studyMaterials = JSON.parse(responseContent);
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

    // Basic validation of the response structure
    const requiredFields = [];
    if (outputSelection.studyGuide) requiredFields.push('studyGuide');
    if (outputSelection.flashcards) requiredFields.push('flashcards');
    if (outputSelection.practiceQuestions) requiredFields.push('quizQuestions');
    if (outputSelection.studyPlan) requiredFields.push('studyCalendar');
    if (outputSelection.formulaSheets) requiredFields.push('formulaSheets');
    if (outputSelection.practiceExam) requiredFields.push('practiceExam');
    if (outputSelection.homeworkFeedback) requiredFields.push('homeworkFeedback');

    for (const field of requiredFields) {
      if (!studyMaterials[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Save study plan to database
    const { data: savedStudyPlan, error: saveError } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        title: `${courseName} - Study Plan`,
        course_name: courseName,
        exam_date: examDate,
        study_hours_per_day: studyHoursPerDay,
        preparedness_level: preparednessLevel,
        content_data: studyMaterials,
        metadata: {
          daysUntilExam,
          contentLength: studyMaterial.length,
          fileCount: files.length,
          topics: topics || null,
          generatedAt: new Date().toISOString()
        },
        output_selection: outputSelection,
        is_active: true
      })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json(
        { error: 'Failed to save study plan to database' },
        { status: 500 }
      );
    }

    // Save uploaded files metadata
    if (files.length > 0) {
      const fileRecords = files.map(file => ({
        user_id: user.id,
        study_plan_id: savedStudyPlan.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        processing_status: 'completed' as const
      }));

      const { error: filesError } = await supabase
        .from('uploaded_files')
        .insert(fileRecords);

      if (filesError) {
        // Failed to save file metadata
      }
    }

    // Update usage stats
    await supabase.rpc('update_usage_stats', {
      user_id: user.id,
      stat_type: 'study_plans_created_this_month',
      increment_value: 1
    });

    await supabase.rpc('update_usage_stats', {
      user_id: user.id,
      stat_type: 'files_uploaded_this_month',
      increment_value: files.length
    });

    return NextResponse.json({
      success: true,
      studyPlanId: savedStudyPlan.id,
      data: studyMaterials,
      metadata: {
        courseName,
        examDate,
        daysUntilExam,
        preparednessLevel,
        studyHoursPerDay,
        contentLength: studyMaterial.length,
        selectedOutputs: outputSelection,
        fileCount: files.length,
        userTier,
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
        error: 'Failed to generate study materials. Please try again.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}