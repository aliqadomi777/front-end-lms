import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const AdminCourseManagement = () => {
  const [pendingCourses, setPendingCourses] = useState([]);
  const [rejectedCourses, setRejectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [pendingResponse, rejectedResponse] = await Promise.all([
        api.get('/courses/pending'),
        api.get('/courses/rejected')
      ]);
      
      setPendingCourses(pendingResponse.data.data || []);
      setRejectedCourses(rejectedResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId) => {
    try {
      setActionLoading(courseId);
      await api.put(`/courses/${courseId}/approve`, { action: 'approve' });
      toast.success('Course approved successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error approving course:', error);
      toast.error('Failed to approve course');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      setActionLoading(selectedCourse.id);
      await api.put(`/courses/${selectedCourse.id}/approve`, {
        action: 'reject',
        rejection_reason: rejectionReason
      });
      toast.success('Course rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error rejecting course:', error);
      toast.error('Failed to reject course');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (course) => {
    setSelectedCourse(course);
    setShowRejectDialog(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'secondary', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const CourseCard = ({ course, showActions = true }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{course.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Instructor: {course.instructor_name || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600">
              Category: {course.category_name || 'Uncategorized'}
            </p>
            <p className="text-sm text-gray-600">
              Level: {course.level}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(course.status)}
            <p className="text-xs text-gray-500">
              Created: {new Date(course.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4">
          {course.description || 'No description available'}
        </p>
        
        {course.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
            <p className="text-sm text-red-700">{course.rejection_reason}</p>
          </div>
        )}
        
        {showActions && course.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleApproveCourse(course.id)}
              disabled={actionLoading === course.id}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === course.id ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => openRejectDialog(course)}
              disabled={actionLoading === course.id}
            >
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading courses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Course Management</h1>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending Courses ({pendingCourses.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected Courses ({rejectedCourses.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          {pendingCourses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No pending courses</p>
              </CardContent>
            </Card>
          ) : (
            pendingCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6">
          {rejectedCourses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No rejected courses</p>
              </CardContent>
            </Card>
          ) : (
            rejectedCourses.map(course => (
              <CourseCard key={course.id} course={course} showActions={false} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Course Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to reject "{selectedCourse?.title}"?</p>
            <div>
              <label className="block text-sm font-medium mb-2">
                Rejection Reason (Optional)
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide feedback to help the instructor improve the course..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                  setSelectedCourse(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectCourse}
                disabled={actionLoading === selectedCourse?.id}
              >
                {actionLoading === selectedCourse?.id ? 'Rejecting...' : 'Reject Course'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourseManagement;