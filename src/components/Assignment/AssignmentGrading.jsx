import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { assignmentAPI } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Clock,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  Edit,
  Users,
  BarChart3,
} from 'lucide-react';

const AssignmentGrading = () => {
  const { id: assignmentId, courseId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeDialog, setGradeDialog] = useState(false);
  const [gradeData, setGradeData] = useState({
    grade: '',
    feedback: ''
  });
  const [grading, setGrading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, graded, ungraded, late

  useEffect(() => {
    fetchAssignmentAndSubmissions();
  }, [assignmentId]);

  const fetchAssignmentAndSubmissions = async () => {
    try {
      const [assignmentResponse, submissionsResponse] = await Promise.all([
        assignmentAPI.getAssignment(assignmentId),
        assignmentAPI.getSubmissions(assignmentId)
      ]);

      if (assignmentResponse.success) {
        setAssignment(assignmentResponse.data);
      }

      if (submissionsResponse.success) {
        setSubmissions(submissionsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
    setGradeDialog(true);
  };

  const handleSaveGrade = async () => {
    if (!gradeData.grade || isNaN(gradeData.grade)) {
      toast.error('Please enter a valid grade');
      return;
    }

    const grade = parseFloat(gradeData.grade);
    if (grade < 0 || grade > assignment.points) {
      toast.error(`Grade must be between 0 and ${assignment.points}`);
      return;
    }

    setGrading(true);
    try {
      const response = await assignmentAPI.gradeSubmission(selectedSubmission.id, {
        grade: grade,
        feedback: gradeData.feedback
      });

      if (response.success) {
        toast.success('Grade saved successfully');
        setGradeDialog(false);
        fetchAssignmentAndSubmissions();
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Failed to save grade');
    } finally {
      setGrading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubmissionStatus = (submission) => {
    if (submission.grade !== null) {
      return { text: 'Graded', color: 'default' };
    }
    
    if (assignment.due_date && new Date(submission.submitted_at) > new Date(assignment.due_date)) {
      return { text: 'Late', color: 'destructive' };
    }
    
    return { text: 'Submitted', color: 'secondary' };
  };

  const getFilteredSubmissions = () => {
    switch (filter) {
      case 'graded':
        return submissions.filter(s => s.grade !== null);
      case 'ungraded':
        return submissions.filter(s => s.grade === null);
      case 'late':
        return submissions.filter(s => 
          assignment.due_date && new Date(s.submitted_at) > new Date(assignment.due_date)
        );
      default:
        return submissions;
    }
  };

  const getStatistics = () => {
    const total = submissions.length;
    const graded = submissions.filter(s => s.grade !== null).length;
    const ungraded = total - graded;
    const late = submissions.filter(s => 
      assignment.due_date && new Date(s.submitted_at) > new Date(assignment.due_date)
    ).length;
    
    const grades = submissions.filter(s => s.grade !== null).map(s => s.grade);
    const average = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : 0;
    
    return { total, graded, ungraded, late, average };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Assignment Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The assignment you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const stats = getStatistics();
  const filteredSubmissions = getFilteredSubmissions();

  return (
    <div className="container mx-auto p-6">
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{assignment.title} - Grading</h1>
            <p className="text-muted-foreground mt-2">{assignment.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Points</p>
            <p className="text-2xl font-bold">{assignment.points}</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Submissions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Graded</p>
                <p className="text-2xl font-bold">{stats.graded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Ungraded</p>
                <p className="text-2xl font-bold">{stats.ungraded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Late</p>
                <p className="text-2xl font-bold">{stats.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Average Grade</p>
                <p className="text-2xl font-bold">{stats.average}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Label htmlFor="filter">Filter submissions:</Label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submissions ({stats.total})</SelectItem>
            <SelectItem value="ungraded">Ungraded ({stats.ungraded})</SelectItem>
            <SelectItem value="graded">Graded ({stats.graded})</SelectItem>
            <SelectItem value="late">Late Submissions ({stats.late})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            Review and grade student submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Submissions</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'No students have submitted this assignment yet.'
                  : `No submissions match the selected filter: ${filter}.`
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => {
                  const status = getSubmissionStatus(submission);
                  return (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.student_name || 'Unknown Student'}</p>
                          <p className="text-sm text-muted-foreground">{submission.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatDate(submission.submitted_at)}</p>
                          {assignment.due_date && new Date(submission.submitted_at) > new Date(assignment.due_date) && (
                            <p className="text-xs text-destructive">Late submission</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.color}>{status.text}</Badge>
                      </TableCell>
                      <TableCell>
                        {submission.grade !== null ? (
                          <div>
                            <p className="font-medium">{submission.grade}/{assignment.points}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((submission.grade / assignment.points) * 100)}%
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not graded</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Submission Details</DialogTitle>
                                <DialogDescription>
                                  {submission.student_name}'s submission for {assignment.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {submission.text_submission && (
                                  <div>
                                    <Label className="text-base font-semibold">Text Submission</Label>
                                    <div className="mt-2 p-4 bg-muted rounded-lg">
                                      <p className="whitespace-pre-wrap">{submission.text_submission}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {submission.file_path && (
                                  <div>
                                    <Label className="text-base font-semibold">File Submission</Label>
                                    <div className="mt-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => window.open(submission.file_path, '_blank')}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download File
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {submission.feedback && (
                                  <div>
                                    <Label className="text-base font-semibold">Previous Feedback</Label>
                                    <div className="mt-2 p-4 bg-muted rounded-lg">
                                      <p className="whitespace-pre-wrap">{submission.feedback}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGradeSubmission(submission)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grade Dialog */}
      <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission && `Grading ${selectedSubmission.student_name}'s submission`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade (out of {assignment.points})</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max={assignment.points}
                step="0.1"
                value={gradeData.grade}
                onChange={(e) => setGradeData(prev => ({ ...prev, grade: e.target.value }))}
                placeholder={`Enter grade (0-${assignment.points})`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                value={gradeData.feedback}
                onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                placeholder="Provide feedback for the student..."
                rows={4}
              />
            </div>
            
            {gradeData.grade && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Grade Preview</p>
                <p className="text-lg">
                  {gradeData.grade}/{assignment.points} 
                  ({Math.round((parseFloat(gradeData.grade) / assignment.points) * 100)}%)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGrade} disabled={grading}>
              {grading ? 'Saving...' : 'Save Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentGrading;