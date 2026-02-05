import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles,
  ArrowLeft,
  RotateCw,
  Loader2,
  Users,
  Clock,
  Target,
  Star
} from 'lucide-react'
import { callAIAgent, type NormalizedAgentResponse } from '@/utils/aiAgent'
import { cn } from '@/lib/utils'

// Agent ID from response schema
const AGENT_ID = "6984dfd4ee065bca253754c6"

// TypeScript interfaces based on ACTUAL test response
interface QuizQuestion {
  text: string
  options: string[]
  question_type: string
}

interface KeyAttributes {
  player_count: string
  complexity: string
  play_time: string
  themes: string[]
}

interface GameRecommendation {
  rank: number
  game_name: string
  match_score: number
  match_explanation: string
  box_art_url: string
  key_attributes: KeyAttributes
}

interface QuizSummary {
  total_questions_asked: number
  user_preferences_identified: {
    player_count: string
    complexity: string
    themes: string[]
    play_time: string
  }
}

interface QuizInProgressResult {
  quiz_status: 'in_progress'
  current_question_number?: number
  total_questions_planned?: number
  question: QuizQuestion
  progress_percentage?: number
}

interface QuizCompleteResult {
  quiz_status: 'complete'
  recommendations: GameRecommendation[]
  quiz_summary: QuizSummary
}

type QuizResult = QuizInProgressResult | QuizCompleteResult

type AppState = 'welcome' | 'quiz' | 'results' | 'loading' | 'error'

// Sub-components defined outside Home to prevent re-creation
function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in duration-700">
        {/* Hero Icons */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="w-20 h-20 bg-purple-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-12 transition-transform">
            <Sparkles className="w-10 h-10 text-amber-200" />
          </div>
          <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 hover:-rotate-12 transition-transform">
            <Target className="w-10 h-10 text-white" />
          </div>
          <div className="w-20 h-20 bg-purple-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-12 transition-transform">
            <Star className="w-10 h-10 text-amber-200" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-purple-900 leading-tight">
            Let's Find Your Perfect Game!
          </h1>
          <p className="text-xl text-purple-700 max-w-xl mx-auto">
            Answer a few quick questions and discover board games you'll love
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={onStart}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-6 text-xl rounded-full shadow-xl transform hover:scale-105 transition-all h-auto min-h-[60px]"
        >
          Let's Go!
          <Sparkles className="ml-2 w-6 h-6" />
        </Button>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto">
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4 shadow-sm">
            <div className="text-3xl mb-2">🎲</div>
            <p className="text-sm text-purple-800 font-medium">Personalized Picks</p>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4 shadow-sm">
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-sm text-purple-800 font-medium">Quick 2-Minute Quiz</p>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4 shadow-sm">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-sm text-purple-800 font-medium">Top 3 Matches</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuizScreen({
  quizData,
  onAnswer,
  onBack,
  isLoading
}: {
  quizData: QuizInProgressResult
  onAnswer: (answer: string) => void
  onBack: () => void
  isLoading: boolean
}) {
  const progress = quizData.progress_percentage || 0
  const currentQ = quizData.current_question_number || 1
  const totalQ = quizData.total_questions_planned || 6

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-purple-100 p-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-purple-700 hover:text-purple-900"
            disabled={isLoading || currentQ <= 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-sm font-medium text-purple-700">
            Question {currentQ} of {totalQ}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalQ }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i < currentQ ? "bg-purple-700" : "bg-purple-200"
                )}
              />
            ))}
          </div>
        </div>

        {/* Question Card */}
        <Card className="border-2 border-purple-200 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl md:text-3xl font-bold text-purple-900 leading-tight text-center">
              {quizData.question.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Choice Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizData.question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onAnswer(option)}
                  disabled={isLoading}
                  className={cn(
                    "min-h-[80px] p-6 rounded-2xl border-2 font-medium text-lg transition-all transform hover:scale-105 active:scale-95",
                    "bg-white hover:bg-purple-50 border-purple-300 hover:border-purple-500 text-purple-900",
                    "focus:outline-none focus:ring-4 focus:ring-purple-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    option
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ResultsScreen({
  results,
  onRetake
}: {
  results: QuizCompleteResult
  onRetake: () => void
}) {
  const [selectedRank, setSelectedRank] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-purple-100 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Animation */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Star className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-purple-900">
            Your Top Picks!
          </h1>
          <p className="text-lg text-purple-700">
            We found {results.recommendations.length} perfect games for you
          </p>
        </div>

        {/* Game Cards */}
        <div className="space-y-6">
          {results.recommendations.map((game, index) => {
            const isExpanded = selectedRank === game.rank

            return (
              <Card
                key={game.rank}
                className={cn(
                  "border-2 shadow-xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom",
                  game.rank === 1 && "border-yellow-400 bg-gradient-to-br from-yellow-50 to-white",
                  game.rank === 2 && "border-gray-300 bg-gradient-to-br from-gray-50 to-white",
                  game.rank === 3 && "border-orange-300 bg-gradient-to-br from-orange-50 to-white",
                  isExpanded && "ring-4 ring-purple-200"
                )}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Rank Badge & Box Art */}
                  <div className="relative md:w-48 lg:w-64 flex-shrink-0">
                    {/* Rank Badge */}
                    <div className={cn(
                      "absolute top-4 left-4 z-10 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg",
                      game.rank === 1 && "bg-yellow-400 text-yellow-900",
                      game.rank === 2 && "bg-gray-300 text-gray-800",
                      game.rank === 3 && "bg-orange-400 text-orange-900"
                    )}>
                      #{game.rank}
                    </div>

                    {/* Box Art */}
                    <img
                      src={game.box_art_url}
                      alt={game.game_name}
                      className="w-full h-64 md:h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%239333ea" width="300" height="300"/%3E%3Ctext fill="%23ffffff" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EBoard Game%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 space-y-4">
                    {/* Title & Match Score */}
                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-3xl font-bold text-purple-900">
                        {game.game_name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-700 text-white px-3 py-1">
                          {game.match_score}% Match
                        </Badge>
                      </div>
                    </div>

                    {/* Key Attributes Pills */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-purple-300 text-purple-800 px-3 py-1 rounded-full">
                        <Users className="w-3 h-3 mr-1" />
                        {game.key_attributes.player_count} players
                      </Badge>
                      <Badge variant="outline" className="border-purple-300 text-purple-800 px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3 mr-1" />
                        {game.key_attributes.play_time}
                      </Badge>
                      <Badge variant="outline" className="border-purple-300 text-purple-800 px-3 py-1 rounded-full">
                        <Target className="w-3 h-3 mr-1" />
                        {game.key_attributes.complexity}
                      </Badge>
                    </div>

                    {/* Themes */}
                    <div className="flex flex-wrap gap-2">
                      {game.key_attributes.themes.map((theme, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 px-3 py-1"
                        >
                          {theme}
                        </Badge>
                      ))}
                    </div>

                    <Separator />

                    {/* Match Explanation */}
                    <p className="text-purple-800 leading-relaxed">
                      {game.match_explanation}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Quiz Summary */}
        {results.quiz_summary && (
          <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl text-purple-900">Your Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-purple-600 font-medium mb-1">Player Count</p>
                  <p className="text-purple-900">{results.quiz_summary.user_preferences_identified.player_count}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium mb-1">Complexity</p>
                  <p className="text-purple-900">{results.quiz_summary.user_preferences_identified.complexity}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium mb-1">Play Time</p>
                  <p className="text-purple-900">{results.quiz_summary.user_preferences_identified.play_time}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium mb-1">Themes</p>
                  <p className="text-purple-900">{results.quiz_summary.user_preferences_identified.themes.join(', ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Retake Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onRetake}
            size="lg"
            variant="outline"
            className="border-2 border-purple-700 text-purple-700 hover:bg-purple-700 hover:text-white px-8 py-6 text-lg rounded-full h-auto"
          >
            <RotateCw className="w-5 h-5 mr-2" />
            Retake Quiz
          </Button>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-purple-100 flex items-center justify-center p-4">
      <div className="text-center space-y-6 animate-pulse">
        <div className="flex justify-center">
          <Loader2 className="w-16 h-16 text-purple-700 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-purple-900">Finding Your Perfect Games...</h2>
          <p className="text-purple-700">Analyzing your preferences</p>
        </div>
      </div>
    </div>
  )
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="max-w-md border-2 border-red-200 bg-white">
        <CardHeader>
          <CardTitle className="text-red-900">Oops! Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-700">{error}</p>
          <Button onClick={onRetry} className="w-full bg-purple-700 hover:bg-purple-800">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Main component
export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [quizData, setQuizData] = useState<QuizInProgressResult | null>(null)
  const [results, setResults] = useState<QuizCompleteResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [sessionId, setSessionId] = useState<string>('')

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(`game-quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  }, [])

  const resetQuiz = () => {
    setAppState('welcome')
    setQuizData(null)
    setResults(null)
    setError(null)
    setConversationHistory([])
    setSessionId(`game-quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  }

  const handleStartQuiz = async () => {
    setIsLoading(true)
    setAppState('loading')
    setError(null)

    try {
      const result = await callAIAgent(
        "start quiz",
        AGENT_ID,
        { session_id: sessionId }
      )

      if (result.success && result.response.status === 'success') {
        const data = result.response.result as QuizResult

        if (data.quiz_status === 'in_progress') {
          setQuizData(data)
          setConversationHistory(['start quiz'])
          setAppState('quiz')
        } else {
          setError('Unexpected response from agent')
          setAppState('error')
        }
      } else {
        setError(result.response.message || 'Failed to start quiz')
        setAppState('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      setAppState('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = async (answer: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await callAIAgent(
        answer,
        AGENT_ID,
        { session_id: sessionId }
      )

      if (result.success && result.response.status === 'success') {
        const data = result.response.result as QuizResult
        const newHistory = [...conversationHistory, answer]
        setConversationHistory(newHistory)

        if (data.quiz_status === 'in_progress') {
          setQuizData(data)
          setAppState('quiz')
        } else if (data.quiz_status === 'complete') {
          setResults(data)
          setAppState('results')
        }
      } else {
        setError(result.response.message || 'Failed to process answer')
        setAppState('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      setAppState('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = async () => {
    // For simplicity, just restart the quiz
    // A full implementation would replay conversation history minus last answer
    resetQuiz()
  }

  // Render based on state
  if (appState === 'welcome') {
    return <WelcomeScreen onStart={handleStartQuiz} />
  }

  if (appState === 'loading') {
    return <LoadingScreen />
  }

  if (appState === 'error' && error) {
    return <ErrorScreen error={error} onRetry={resetQuiz} />
  }

  if (appState === 'quiz' && quizData) {
    return (
      <QuizScreen
        quizData={quizData}
        onAnswer={handleAnswer}
        onBack={handleBack}
        isLoading={isLoading}
      />
    )
  }

  if (appState === 'results' && results) {
    return <ResultsScreen results={results} onRetake={resetQuiz} />
  }

  // Fallback
  return <LoadingScreen />
}
