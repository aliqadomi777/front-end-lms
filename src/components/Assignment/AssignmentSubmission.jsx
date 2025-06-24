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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  Clock,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Download,
} from 'lucide-react';

const AssignmentSubmission = () => {
  const { id: assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    text_submission: '',
    file_submission: null
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    fetchAssignmentAndSubmission();
  }, [assignmentId]);

  const fetchAssignmentAndSubmission = async () => {
    try {
      if (!assignmentId) {
        setLoading(false);
        return;
      }
      
      const [assignmentResponse, submissionResponse] = await Promise.all([
        assignmentAPI.getAssignment(assignmentId),
        assignmentAPI.getSubmissions(assignmentId)
      ]);

      if (assignmentResponse.success) {
        setAssignment(assignmentResponse.data);
      }

      if (submissionResponse.success && submissionResponse.data.length > 0) {
        const userSubmission = submissionResponse.data[0];
        setSubmission(userSubmission);
        setSubmissionData({
          text_submission: userSubmission.text_submission || '',
          file_submission: null
        });
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSubmissionData(prev => ({ ...prev, file_submission: file }));
      
      // Create preview for certain file types
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!submissionData.text_submission.trim() && !submissionData.file_submission) {
      toast.error('Please provide either text submission or file submission');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignment_id', assignmentId);
      
      if (submissionData.text_submission.trim()) {
        formData.append('text_submission', submissionData.text_submission);
      }
      
      if (submissionData.file_submission) {
        formData.append('file_submission', submissionData.file_submission);
      }

      const response = await assignmentAPI.submitAssignment(assignmentId, formData);
      
      if (response.success) {
        toast.success('Assignment submitted successfully!');
        fetchAssignmentAndSubmission();
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = () => {
    if (!assignment?.due_date) return false;
    return new Date() > new Date(assignment.due_date);
  };

  const canSubmit = () => {
    if (submission && submission.status === 'submitted') return false;
    if (isOverdue()) return false;
    return true;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubmissionStatus = () => {
    if (!submission) return { text: 'Not Submitted', color: 'destructive' };
    
    switch (submission.status) {
      case 'submitted':
        return { text: 'Submitted', color: 'default' };
      case 'graded':
        return { text: 'Graded', color: 'default' };
      case 'late':
        return { text: 'Late Submission', color: 'destructive' };
      default:
        return { text: 'Draft', color: 'secondary' };
    }
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

  const status = getSubmissionStatus();

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
            <p className="text-muted-foreground mt-2">{assignment.description}</p>
          </div>
          <Badge variant={status.color}>{status.text}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className={`text-sm ${
                    isOverdue() ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {assignment.due_date ? formatDate(assignment.due_date) : 'No due date'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Points</p>
                  <p className="text-sm text-muted-foreground">{assignment.points} points</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Submission Type</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {assignment.submission_type?.replace('_', ' ') || 'Text'}
                  </p>
                </div>
              </div>

              {isOverdue() && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium text-destructive">Assignment Overdue</p>
                  </div>
                  <p className="text-xs text-destructive/80 mt-1">
                    This assignment is past its due date. Late submissions may be penalized.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Submission Info */}
          {submission && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Submission History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Submitted At</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(submission.submitted_at)}
                  </p>
                </div>
                
                {submission.grade !== null && (
                  <div>
                    <p className="text-sm font-medium">Grade</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.grade}/{assignment.points} points
                    </p>
                  </div>
                )}
                
                {submission.feedback && (
                  <div>
                    <p className="text-sm font-medium">Feedback</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.feedback}
                    </p>
                  </div>
                )}
                
                {submission.file_path && (
                  <div>
                    <p className="text-sm font-medium">Submitted File</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => window.open(submission.file_path, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Submission Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {submission ? 'Update Submission' : 'Submit Assignment'}
                {submission && submission.status === 'submitted' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </CardTitle>
              <CardDescription>
                {canSubmit()
                  ? 'Complete your assignment submission below'
                  : submission?.status === 'submitted'
                  ? 'Your assignment has been submitted and is awaiting grading'
                  : 'Submission is no longer available'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {canSubmit() ? (
                <>
                  {/* Text Submission */}
                  {(assignment.submission_type === 'text' || assignment.submission_type === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="textSubmission">Text Submission</Label>
                      <Textarea
                        id="textSubmission"
                        value={submissionData.text_submission}
                        onChange={(e) => setSubmissionData(prev => ({
                          ...prev,
                          text_submission: e.target.value
                        }))}
                        placeholder="Enter your assignment text here..."
                        rows={10}
                        className="min-h-[200px]"
                      />
                    </div>
                  )}

                  {/* File Submission */}
                  {(assignment.submission_type === 'file' || assignment.submission_type === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="fileSubmission">File Submission</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <div className="space-y-2">
                            <Label htmlFor="fileSubmission" className="cursor-pointer">
                              <span className="text-sm font-medium text-primary hover:text-primary/80">
                                Click to upload a file
                              </span>
                              <Input
                                id="fileSubmission"
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                              />
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP
                            </p>
                          </div>
                        </div>
                        
                        {submissionData.file_submission && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {submissionData.file_submission.name}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSubmissionData(prev => ({ ...prev, file_submission: null }));
                                  setFilePreview(null);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                            
                            {filePreview && (
                              <div className="mt-3">
                                <img
                                  src={filePreview}
                                  alt="Preview"
                                  className="max-w-full h-32 object-contain rounded"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={submitting || (!submissionData.text_submission.trim() && !submissionData.file_submission)}
                          className="flex-1"
                        >
                          {submitting ? 'Submitting...' : submission ? 'Update Submission' : 'Submit Assignment'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to submit this assignment? 
                            {submission ? ' This will update your previous submission.' : ' You may not be able to change it after submission.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleSubmit}>
                            {submission ? 'Update' : 'Submit'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  {submission?.status === 'submitted' ? (
                    <div>
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Assignment Submitted</h3>
                      <p className="text-muted-foreground">
                        Your assignment has been submitted successfully and is awaiting grading.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Submission Closed</h3>
                      <p className="text-muted-foreground">
                        The submission deadline has passed and submissions are no longer accepted.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmission;