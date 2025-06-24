import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { isValidCourseId, validateCourseIdOrRedirect } from "@/utils/courseValidation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
  Maximize,
  CheckCircle,
  Circle,
  FileText,
  Download,
  MessageSquare,
  Clock,
  BookOpen,
  Brain,
  Calendar,
  Award,
} from "lucide-react";
import { useCourse, useLessonsByCourse, useAssignments } from "@/hooks/useApi";
import { useState, useEffect, useMemo } from "react";
import { quizAPI, assignmentAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CoursePlayer = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Early validation - redirect if course ID is invalid format
  useEffect(() => {
    if (courseId && !isValidCourseId(courseId)) {
      validateCourseIdOrRedirect(courseId, navigate);
      return;
    }
  }, [courseId, navigate]);
  
  // Only make API calls if course ID is valid format
  const shouldFetchData = courseId && isValidCourseId(courseId);
  
  const { data: courseData, isLoading: courseLoading, error: courseError } = useCourse(shouldFetchData ? courseId : null);
  const { data: lessonsData, isLoading: lessonsLoading, error: lessonsError } = useLessonsByCourse(shouldFetchData ? courseId : null);
  const { data: assignmentsData, isLoading: assignmentsLoading, error: assignmentsError } = useAssignments({ courseId: shouldFetchData ? courseId : null });

  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState({});
  const [quizAttempts, setQuizAttempts] = useState({});
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(0);

  // Handle course not found error
  useEffect(() => {
    if (courseError && courseError.response?.status === 404) {
      console.warn(`Course ID ${courseId} does not exist. Redirecting to dashboard.`);
      navigate('/student/dashboard', { replace: true });
      return;
    }
  }, [courseError, courseId, navigate]);

  const course = courseData?.data || {};
  const lessons = Array.isArray(lessonsData?.data) ? lessonsData.data : [];
  const assignments = Array.isArray(assignmentsData?.data) ? assignmentsData.data : [];

  // Calculate derived values with memoization to prevent unnecessary re-renders
  const currentLesson = useMemo(() => {
    return lessons.find(lesson => lesson.id === currentLessonId) || lessons[0];
  }, [lessons, currentLessonId]);
  
  const currentLessonIndex = useMemo(() => {
    return lessons.findIndex(lesson => lesson.id === currentLessonId) + 1;
  }, [lessons, currentLessonId]);
  
  const progress = useMemo(() => {
    return lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;
  }, [lessons.length, completedLessons]);

  // Helper function to check if assignment is overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Fetch quizzes for the course
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setQuizzesLoading(true);
        const response = await quizAPI.getQuizzesByCourse(courseId);
        const quizzesData = response.data;
        // Only update if data is different to prevent unnecessary re-renders
        if (Array.isArray(quizzesData)) {
          setQuizzes(quizzesData);
        } else {
          setQuizzes([]);
        }
      } catch (error) {
        // Only log non-404 errors to avoid console spam for non-existent courses
        if (error.response?.status !== 404) {
          console.error('Error fetching quizzes:', error);
        }
        setQuizzes([]);
      } finally {
        setQuizzesLoading(false);
      }
    };

    // Only fetch quizzes if course ID is valid, exists in database, and no course error
    if (shouldFetchData && !courseError) {
      fetchQuizzes();
    } else {
      setQuizzesLoading(false);
    }
  }, [courseId, courseError, shouldFetchData]);

  // Fetch assignment submissions and quiz attempts
  useEffect(() => {
    // Skip if no data to fetch or user not available
    if ((!assignments.length && !quizzes.length) || !user?.id) {
      return;
    }

    const fetchSubmissionData = async () => {
      try {
        // Fetch assignment submissions
        if (assignments.length > 0) {
          const submissionsPromises = assignments.map(async (assignment) => {
            try {
              const response = await assignmentAPI.getUserSubmissions(assignment.id);
              return { assignmentId: assignment.id, submissions: response.data || [] };
            } catch (error) {
              return { assignmentId: assignment.id, submissions: [] };
            }
          });

          const submissionsResults = await Promise.all(submissionsPromises);
          const submissionsMap = {};
          submissionsResults.forEach(({ assignmentId, submissions }) => {
            submissionsMap[assignmentId] = submissions[0] || null; // Get latest submission
          });
          setAssignmentSubmissions(submissionsMap);
        }

        // Fetch quiz attempts (call API only once for all user attempts)
        if (quizzes.length > 0) {
          try {
            const response = await quizAPI.getUserQuizAttempts(user.id);
            const allAttempts = response.data || [];
            
            // Group attempts by quiz ID
            const attemptsMap = {};
            quizzes.forEach(quiz => {
              attemptsMap[quiz.id] = allAttempts.filter(attempt => attempt.quiz_id === quiz.id);
            });
            setQuizAttempts(attemptsMap);
          } catch (error) {
            console.error('Error fetching quiz attempts:', error);
            // Initialize empty attempts for all quizzes
            const attemptsMap = {};
            quizzes.forEach(quiz => {
              attemptsMap[quiz.id] = [];
            });
            setQuizAttempts(attemptsMap);
          }
        }
      } catch (error) {
        console.error('Error fetching submission data:', error);
      }
    };

    // Add debouncing to prevent rapid successive calls
    const timeoutId = setTimeout(fetchSubmissionData, 300);
    return () => clearTimeout(timeoutId);
  }, [assignments.length, quizzes.length, user?.id]); // Use lengths instead of arrays to reduce re-renders

  // Helper functions
  const handleTakeQuiz = (quizId) => {
    navigate(`/quiz/${quizId}/take`);
  };

  const handleViewQuizResults = (quizId) => {
    navigate(`/quiz/${quizId}/results`);
  };

  const handleSubmitAssignment = (assignmentId) => {
    navigate(`/assignment/${assignmentId}/submit`);
  };

  const handleViewSubmission = (assignmentId) => {
    navigate(`/assignment/${assignmentId}/submission`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  // Set initial lesson if not already set
  useEffect(() => {
    if (lessons.length > 0 && !currentLessonId) {
      setCurrentLessonId(lessons[0].id);
    }
  }, [lessons.length, currentLessonId]); // Only depend on lessons.length, not the entire lessons array

  // TODO: Implement lesson completion tracking
  // This should be replaced with actual completion data from the API
  useEffect(() => {
    if (lessons.length > 0) {
      setCompletedLessons(0); // Placeholder - implement actual completion tracking
    }
  }, [lessons.length]); // Only depend on lessons.length, not the entire lessons array

  // Show error for invalid course ID
  if (courseId && !isValidCourseId(courseId)) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Invalid Course ID</h2>
            <p className="text-muted-foreground mb-4">
              Course ID {courseId} is not valid. Please check the course ID and try again.
            </p>
            <div className="space-x-2">
              <Button onClick={() => navigate('/dashboard')} variant="default">
                Go to Dashboard
              </Button>
              <Button onClick={() => navigate('/courses')} variant="outline">
                Browse Courses
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const isLoading = courseLoading || lessonsLoading || assignmentsLoading || quizzesLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle errors - improved error handling for 404 and other errors
  if (courseError || lessonsError || assignmentsError) {
    const is404Error = courseError?.response?.status === 404 || 
                      lessonsError?.response?.status === 404 || 
                      assignmentsError?.response?.status === 404;
    
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">
              {is404Error ? 'Course Not Found' : 'Error Loading Course'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {is404Error 
                ? `Course ID ${courseId} doesn't exist. Please check the URL or select a valid course.`
                : 'There was an error loading the course. Please try again later.'
              }
            </p>
            <div className="space-x-2">
              <Button onClick={() => navigate('/dashboard')} variant="default">
                Go to Dashboard
              </Button>
              <Button onClick={() => navigate('/courses')} variant="outline">
                Browse Courses
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Course Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{course.title || 'Course Title'}</h1>
              <p className="text-muted-foreground">
                by {course.instructor_name || 'Instructor'}
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  Lesson {currentLessonIndex} of{" "}
                  {lessons.length}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Progress: {progress}%</span>
                </div>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-0">
                {/* Video Player */}
                <div className="aspect-video bg-black relative rounded-t-lg overflow-hidden">
                  {currentLesson?.content_type === 'video' && currentLesson?.content_url ? (
                    <video
                      className="w-full h-full"
                      controls
                      src={currentLesson.content_url}
                      onLoadedMetadata={(e) => setVideoDuration(e.target.duration)}
                      onTimeUpdate={(e) => setVideoProgress((e.target.currentTime / e.target.duration) * 100)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center space-y-4">
                        <div className="text-6xl">📄</div>
                        <h3 className="text-xl font-semibold">
                          {currentLesson?.title || 'No lesson selected'}
                        </h3>
                        <p className="text-gray-300">
                          {currentLesson?.content_type === 'text' ? 'Text lesson content' : 'No video available'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Custom Progress Bar for Video */}
                  {currentLesson?.content_type === 'video' && currentLesson?.content_url && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="flex items-center justify-between text-white text-sm mb-1">
                        <span>{currentLesson.title}</span>
                        {currentLesson.duration && (
                          <span>{currentLesson.duration} min</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lesson Content Tabs */}
            <Card>
              <CardContent className="p-0">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                    <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="discussions">Discussions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {currentLesson?.title || 'Lesson Overview'}
                      </h3>
                      <p className="text-muted-foreground">
                        {currentLesson?.description || currentLesson?.content_text || 'No description available for this lesson.'}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">
                        Lesson Details
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Type: {currentLesson?.content_type || 'Unknown'}</li>
                        {currentLesson?.duration && <li>• Duration: {currentLesson.duration} minutes</li>}
                        <li>• Free Access: {currentLesson?.is_free ? 'Yes' : 'No'}</li>
                        <li>• Published: {currentLesson?.is_published ? 'Yes' : 'No'}</li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="resources" className="p-6 space-y-4">
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No Resources Available</h3>
                      <p className="text-muted-foreground">
                        Lesson resources will be available here once uploaded by the instructor.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="quizzes" className="p-6 space-y-4">
                    {quizzes.length === 0 ? (
                      <div className="text-center py-8">
                        <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No Quizzes Available</h3>
                        <p className="text-muted-foreground">
                          There are no quizzes for this course yet.
                        </p>
                      </div>
                    ) : (
                      quizzes.map((quiz) => {
                        const attempts = quizAttempts[quiz.id] || [];
                        const hasAttempts = attempts.length > 0;
                        const latestAttempt = hasAttempts ? attempts[0] : null;
                        const canRetake = !quiz.max_attempts || attempts.length < quiz.max_attempts;
                        
                        return (
                          <div
                            key={quiz.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{quiz.title}</p>
                                {quiz.is_published && (
                                  <Badge variant="secondary">Published</Badge>
                                )}
                                {quiz.time_limit && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {quiz.time_limit} min
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {quiz.description || 'No description available'}
                              </p>
                              {hasAttempts && (
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">
                                    Attempts: {attempts.length}
                                    {quiz.max_attempts && ` / ${quiz.max_attempts}`}
                                  </span>
                                  {latestAttempt && (
                                    <span className="flex items-center gap-1">
                                      <Award className="h-4 w-4 text-yellow-500" />
                                      Best Score: {latestAttempt.score || 0}%
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {hasAttempts && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewQuizResults(quiz.id)}
                                >
                                  View Results
                                </Button>
                              )}
                              {quiz.is_published && canRetake && (
                                <Button
                                  onClick={() => handleTakeQuiz(quiz.id)}
                                  size="sm"
                                >
                                  {hasAttempts ? 'Retake Quiz' : 'Take Quiz'}
                                </Button>
                              )}
                              {!quiz.is_published && (
                                <Button variant="outline" size="sm" disabled>
                                  Not Available
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>

                  <TabsContent value="assignments" className="p-6 space-y-4">
                    {assignments.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No Assignments Available</h3>
                        <p className="text-muted-foreground">
                          There are no assignments for this course yet.
                        </p>
                      </div>
                    ) : (
                      assignments.map((assignment) => {
                        const submission = assignmentSubmissions[assignment.id];
                        const hasSubmission = !!submission;
                        const overdue = isOverdue(assignment.due_date);
                        
                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{assignment.title}</p>
                                {assignment.is_published && (
                                  <Badge variant="secondary">Published</Badge>
                                )}
                                {assignment.points && (
                                  <Badge variant="outline">
                                    {assignment.points} pts
                                  </Badge>
                                )}
                                {overdue && !hasSubmission && (
                                  <Badge variant="destructive">Overdue</Badge>
                                )}
                                {hasSubmission && submission.grade !== null && (
                                  <Badge variant="default" className="flex items-center gap-1">
                                    <Award className="h-3 w-3" />
                                    {submission.grade}/{assignment.points}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {assignment.description || 'No description available'}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Due: {formatDate(assignment.due_date)}
                                </span>
                                {hasSubmission && (
                                  <span>
                                    Submitted: {formatDate(submission.submitted_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {hasSubmission && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewSubmission(assignment.id)}
                                >
                                  View Submission
                                </Button>
                              )}
                              {assignment.is_published && (!hasSubmission || !overdue) && (
                                <Button
                                  onClick={() => handleSubmitAssignment(assignment.id)}
                                  size="sm"
                                  variant={hasSubmission ? "outline" : "default"}
                                >
                                  {hasSubmission ? 'Resubmit' : 'Submit Assignment'}
                                </Button>
                              )}
                              {!assignment.is_published && (
                                <Button variant="outline" size="sm" disabled>
                                  Not Available
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>

                  <TabsContent value="discussions" className="p-6">
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">
                        Join the Discussion
                      </h3>
                      <p className="text-muted-foreground">
                        Connect with fellow students and ask questions about
                        this lesson.
                      </p>
                      <Button className="mt-4">Start Discussion</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Course Sidebar */}
          <div className="space-y-6">
            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Content
                </CardTitle>
                <CardDescription>
                  {completedLessons} of{" "}
                  {lessons.length} lessons completed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    onClick={() => setCurrentLessonId(lesson.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      lesson.id === currentLessonId
                        ? "bg-primary/10 border-primary/20 border"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {/* TODO: Implement lesson completion tracking */}
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          lesson.id === currentLessonId ? "text-primary" : ""
                        }`}
                      >
                        {lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lesson.content_type} {lesson.duration ? `• ${lesson.duration} min` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate(`/courses`)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse All Courses
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate(`/student/dashboard`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                {course?.instructor_id && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => window.open(`mailto:${course.instructor_email || 'instructor@example.com'}?subject=Question about ${course.title}`, '_blank')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Instructor
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoursePlayer;
