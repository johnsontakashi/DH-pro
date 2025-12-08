#!/bin/bash

# Script to fix all hardcoded strings with i18n translations
# This script performs systematic find-and-replace across all TSX files

echo "🔧 Starting localization fix..."

# Common replacements that appear frequently
declare -A replacements=(
  # Common UI
  ["'Loading...'"]="t('common.loading')"
  ["'Close'"]="t('common.close')"
  ["\"Close\""]="t('common.close')"

  # Validation messages
  ["'Email is required'"]="t('validation.emailRequired')"
  ["'Please enter a valid email address'"]="t('validation.validEmail')"
  ["'Password is required'"]="t('validation.passwordRequired')"
  ["'Password must be at least 3 characters'"]="t('validation.passwordMinLength')"
  ["'Please fill in all required fields'"]="t('validation.fillAllRequired')"
  ["'Please select a chapter first'"]="t('validation.selectChapterFirst')"

  # Toast messages
  ["'Failed to load subjects'"]="t('messages.failedToLoadSubjects')"
  ["'Failed to load quiz'"]="t('quiz.failedToLoad')"
  ["\"Time's up! Submitting your quiz...\""]="t('quiz.timesUp')"
  ["'No quizzes available for this chapter'"]="t('quiz.noQuizzesAvailable')"
  ["'Assignment created successfully!'"]="t('assignments.createSuccess')"
  ["'Failed to generate assignment'"]="t('assignments.failedToGenerateAssignment')"
  ["'Failed to load quiz results'"]="t('quiz.results.loadingResults')"
  ["'Failed to load flashcards'"]="t('flashcards.failedToLoad')"
  ["'Failed to load progress data'"]="t('progress.failedToLoad')"
  ["'Failed to load analytics'"]="t('analytics.failedToLoad')"

  # Flashcards
  ["'No flashcards due for review!'"]="t('flashcards.noFlashcardsDue')"
  ["'No flashcards found for this chapter. Generate some first!'"]="t('flashcards.noFlashcardsFound')"
  ["'Study session complete! 🎉'"]="t('flashcards.sessionComplete')"
  ["'Great job!'"]="t('flashcards.greatJob')"
  ["'Keep practicing!'"]="t('flashcards.keepPracticing')"
  ["'Loading your study session...'"]="t('flashcards.loadingSession')"

  # Quiz results
  ["'Outstanding! 🌟'"]="t('quiz.results.outstanding')"
  ["'Excellent work! 🎉'"]="t('quiz.results.excellentWork')"
  ["'Good job! 👍'"]="t('quiz.results.goodJob')"
  ["'Keep practicing! 💪'"]="t('quiz.results.keepPracticing')"
  ["'Need more practice 📚'"]="t('quiz.results.needMorePractice')"
  ["'Loading results...'"]="t('quiz.results.loadingResults')"
  ["'No results available'"]="t('quiz.results.noResults')"

  # Login
  ["'Your AI-Powered Learning Assistant'"]="t('login.tagline')"
  ["'✨ AI-powered study tools • 📊 Progress tracking • 🤖 Personalized learning'"]="t('login.features')"
)

# Apply replacements
for search in "${!replacements[@]}"; do
  replace="${replacements[$search]}"
  echo "Replacing: $search -> $replace"

  # Use sed to replace in all TSX files
  find src/pages src/components -name "*.tsx" -type f -exec sed -i "s|$search|{$replace}|g" {} \;
done

echo "✅ Localization fixes applied!"
echo "📝 Next: Build and test language switching"
