import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { quizAPI, lessonAPI } from '@/lib/api';
import { isValidCourseId, validateCourseIdOrRedirect } from '@/utils/courseValidation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';

const QuizManager = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  // Early validation - redirect if course ID is invalid
  useEffect(() => {
    if (courseId && !isValidCourseId(courseId)) {
      validateCourseIdOrRedirect(courseId, navigate);
      return;
    }
  }, [courseId, navigate]);
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    lesson_id: '',
    time_limit: '',
    passing_score: '',
    allow_multiple_attempts: false,
    is_published: false,
    questions: []
  });
  const [questionDialog, setQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionData, setQuestionData] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1
  });

  useEffect(() => {
    // Only fetch data if course ID is valid
    if (courseId && isValidCourseId(courseId)) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [lessonsResponse, quizzesResponse] = await Promise.all([
        lessonAPI.getLessonsByCourse(courseId),
        quizAPI.getQuizzesByCourse ? quizAPI.getQuizzesByCourse(courseId) : Promise.resolve({ success: true, data: [] })
      ]);

      if (lessonsResponse.success) {
        setLessons(lessonsResponse.data);
      }

      if (quizzesResponse.success) {
        setQuizzes(quizzesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizData({
      title: '',
      description: '',
      lesson_id: '',
      time_limit: '',
      passing_score: '',
      allow_multiple_attempts: false,
      is_published: false,
      questions: []
    });
    setIsDialogOpen(true);
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizData({
      title: quiz.title || '',
      description: quiz.description || '',
      lesson_id: quiz.lesson_id || '',
      time_limit: quiz.time_limit || '',
      passing_score: quiz.passing_score || '',
      allow_multiple_attempts: quiz.allow_multiple_attempts || false,
      is_published: quiz.is_published || false,
      questions: quiz.questions || []
    });
    setIsDialogOpen(true);
  };

  const handleSaveQuiz = async () => {
    try {
      const payload = {
        ...quizData,
        course_id: courseId,
        time_limit: quizData.time_limit ? parseInt(quizData.time_limit) : null,
        passing_score: quizData.passing_score ? parseInt(quizData.passing_score) : null
      };

      let response;
      if (editingQuiz) {
        response = await quizAPI.updateQuiz(editingQuiz.id, payload);
      } else {
        response = await quizAPI.createQuiz(payload);
      }

      if (response.success) {
        toast.success(`Quiz ${editingQuiz ? 'updated' : 'created'} successfully`);
        setIsDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error(`Failed to ${editingQuiz ? 'update' : 'create'} quiz`);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const response = await quizAPI.deleteQuiz(quizId);
      if (response.success) {
        toast.success('Quiz deleted successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const handleTogglePublish = async (quiz) => {
    try {
      const response = quiz.is_published
        ? await quizAPI.unpublishQuiz(quiz.id)
        : await quizAPI.publishQuiz(quiz.id);

      if (response.success) {
        toast.success(`Quiz ${quiz.is_published ? 'unpublished' : 'published'} successfully`);
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling quiz publication:', error);
      toast.error('Failed to update quiz publication status');
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionData({
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    });
    setQuestionDialog(true);
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion(index);
    setQuestionData({
      question_text: question.question_text || '',
      options: JSON.parse(question.options || '["" ,"", "", ""]'),
      correct_answer: question.correct_answer || '',
      points: question.points || 1
    });
    setQuestionDialog(true);
  };

  const handleSaveQuestion = () => {
    const newQuestion = {
      question_text: questionData.question_text,
      options: JSON.stringify(questionData.options.filter(opt => opt.trim())),
      correct_answer: questionData.correct_answer,
      points: parseInt(questionData.points)
    };

    const updatedQuestions = [...quizData.questions];
    if (editingQuestion !== null) {
      updatedQuestions[editingQuestion] = newQuestion;
    } else {
      updatedQuestions.push(newQuestion);
    }

    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
    setQuestionDialog(false);
  };

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const updateQuestionOption = (index, value) => {
    const updatedOptions = [...questionData.options];
    updatedOptions[index] = value;
    setQuestionData(prev => ({ ...prev, options: updatedOptions }));
  };

  // Show error for invalid course ID
  if (courseId && !isValidCourseId(courseId)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Invalid Course ID</h2>
          <p className="text-muted-foreground mb-4">
            Course ID {courseId} is not valid. Please check the course ID and try again.
          </p>
          <div className="space-x-2">
            <Button onClick={() => navigate('/instructor/dashboard')} variant="default">
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate('/courses')} variant="outline">
              Browse Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground">Create and manage quizzes for your course</p>
        </div>
        <Button onClick={handleCreateQuiz}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Quiz List */}
      <div className="grid gap-6">
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Quizzes Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first quiz to start assessing your students.
              </p>
              <Button onClick={handleCreateQuiz}>
                <Plus className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          quizzes.map((quiz) => {
            const lesson = lessons.find(l => l.id === quiz.lesson_id);
            return (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {quiz.title}
                        <Badge variant={quiz.is_published ? 'default' : 'secondary'}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {quiz.description}
                      </CardDescription>
                      {lesson && (
                        <p className="text-sm text-muted-foreground">
                          Lesson: {lesson.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(quiz)}
                      >
                        {quiz.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuiz(quiz)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {quiz.questions?.length || 0} Questions
                      </span>
                    </div>
                    {quiz.time_limit && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{quiz.time_limit} min</span>
                      </div>
                    )}
                    {quiz.passing_score && (
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{quiz.passing_score}% to pass</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {quiz.allow_multiple_attempts ? 'Multiple' : 'Single'} attempt
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Quiz Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
            </DialogTitle>
            <DialogDescription>
              {editingQuiz ? 'Update quiz details and questions' : 'Create a new quiz for your course'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={quizData.title}
                  onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter quiz title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson">Lesson</Label>
                <Select
                  value={quizData.lesson_id}
                  onValueChange={(value) => setQuizData(prev => ({ ...prev, lesson_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lesson" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id.toString()}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={quizData.description}
                onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter quiz description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={quizData.time_limit}
                  onChange={(e) => setQuizData(prev => ({ ...prev, time_limit: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={quizData.passing_score}
                  onChange={(e) => setQuizData(prev => ({ ...prev, passing_score: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="multipleAttempts"
                      checked={quizData.allow_multiple_attempts}
                      onCheckedChange={(checked) => setQuizData(prev => ({ ...prev, allow_multiple_attempts: checked }))}
                    />
                    <Label htmlFor="multipleAttempts" className="text-sm">
                      Allow multiple attempts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={quizData.is_published}
                      onCheckedChange={(checked) => setQuizData(prev => ({ ...prev, is_published: checked }))}
                    />
                    <Label htmlFor="published" className="text-sm">
                      Publish immediately
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Questions</h3>
                <Button onClick={handleAddQuestion} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
              
              {quizData.questions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <p className="text-muted-foreground">No questions added yet</p>
                  <Button onClick={handleAddQuestion} variant="outline" className="mt-2">
                    Add First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizData.questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">
                            Question {index + 1}: {question.question_text}
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            Options: {JSON.parse(question.options || '[]').join(', ')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Correct: {question.correct_answer} | Points: {question.points}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuestion(question, index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuiz}>
              {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion !== null ? 'Edit Question' : 'Add Question'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">Question Text</Label>
              <Textarea
                id="questionText"
                value={questionData.question_text}
                onChange={(e) => setQuestionData(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter your question"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Answer Options</Label>
              {questionData.options.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(e) => updateQuestionOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Correct Answer</Label>
                <Select
                  value={questionData.correct_answer}
                  onValueChange={(value) => setQuestionData(prev => ({ ...prev, correct_answer: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionData.options.filter(opt => opt.trim()).map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={questionData.points}
                  onChange={(e) => setQuestionData(prev => ({ ...prev, points: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion}>
              {editingQuestion !== null ? 'Update Question' : 'Add Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizManager;