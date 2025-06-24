import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { quizAPI } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

const QuizResults = () => {
  const { id: quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(location.state?.result || null);
  const [quiz, setQuiz] = useState(location.state?.quiz || null);
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (!result) {
      // If no result in state, try to fetch the latest attempt
      fetchLatestAttempt();
    }
  }, [quizId]);

  const fetchLatestAttempt = async () => {
    try {
      const [quizResponse, attemptsResponse] = await Promise.all([
        quizAPI.getQuiz(quizId),
        quizAPI.getUserQuizAttempts(quizId)
      ]);

      if (quizResponse.success) {
        setQuiz(quizResponse.data);
      }

      if (attemptsResponse.success && attemptsResponse.data.length > 0) {
        // Get the latest attempt
        const latestAttempt = attemptsResponse.data[0];
        setResult(latestAttempt);
      }
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      toast.error('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScorePercentage = () => {
    if (!result || !quiz) return 0;
    return Math.round((result.score / quiz.total_points) * 100);
  };

  const isPassed = () => {
    if (!quiz?.passing_score) return true;
    return getScorePercentage() >= quiz.passing_score;
  };

  const getScoreColor = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeText = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Satisfactory';
    if (percentage >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result || !quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Unable to load quiz results. Please try again.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const scorePercentage = getScorePercentage();
  const passed = isPassed();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{quiz.title} - Results</h1>
        <p className="text-muted-foreground mt-2">{quiz.description}</p>
      </div>

      {/* Results Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Final Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Trophy className={`h-6 w-6 ${getScoreColor()}`} />
              <div>
                <div className={`text-2xl font-bold ${getScoreColor()}`}>
                  {result.score}/{quiz.total_points}
                </div>
                <div className={`text-sm ${getScoreColor()}`}>
                  {scorePercentage}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {passed ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <div className={`text-2xl font-bold ${
                  passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {passed ? 'PASS' : 'FAIL'}
                </div>
                <div className={`text-sm ${getScoreColor()}`}>
                  {getGradeText()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Taken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {formatTime(result.time_taken || 0)}
                </div>
                {quiz.time_limit && (
                  <div className="text-sm text-muted-foreground">
                    of {quiz.time_limit} min
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {new Date(result.submitted_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(result.submitted_at).toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
          <CardDescription>
            Your performance on this quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score Progress</span>
              <span className="text-sm text-muted-foreground">
                {result.score} out of {quiz.total_points} points
              </span>
            </div>
            <Progress value={scorePercentage} className="h-3" />
            
            {quiz.passing_score && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Passing Score: {quiz.passing_score}%
                </span>
                <Badge variant={passed ? 'default' : 'destructive'}>
                  {passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      {result.answers && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
            <CardDescription>
              Review your answers and correct solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {quiz.questions.map((question, index) => {
                const userAnswer = JSON.parse(result.answers || '{}')[question.id];
                const isCorrect = userAnswer === question.correct_answer;
                const options = JSON.parse(question.options || '[]');
                
                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium">
                        Question {index + 1}: {question.question_text}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {question.points} pts
                        </Badge>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer === option;
                        const isCorrectAnswer = question.correct_answer === option;
                        
                        return (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded border ${
                              isCorrectAnswer
                                ? 'bg-green-50 border-green-200'
                                : isUserAnswer
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              <div className="flex gap-1">
                                {isUserAnswer && (
                                  <Badge variant="outline" className="text-xs">
                                    Your Answer
                                  </Badge>
                                )}
                                {isCorrectAnswer && (
                                  <Badge variant="default" className="text-xs">
                                    Correct
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/course/${quiz.course_id}`)}
        >
          Back to Course
        </Button>
        
        {quiz.allow_multiple_attempts && (
          <Button
            onClick={() => navigate(`/quiz/${quizId}/take`)}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizResults;