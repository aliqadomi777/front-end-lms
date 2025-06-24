import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const InstructorCourseStatus = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstructorCourses();
  }, []);

  const fetchInstructorCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/instructor/me');
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleResubmitCourse = async (courseId) => {
    try {
      setActionLoading(courseId);
      await api.put(`/courses/${courseId}/resubmit`);
      toast.success('Course resubmitted for approval');
      fetchInstructorCourses();
    } catch (error) {
      console.error('Error resubmitting course:', error);
      toast.error(error.response?.data?.message || 'Failed to resubmit course');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'secondary', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'default', label: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive', label: 'Rejected', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Your course is under review by our admin team.',
      approved: 'Your course is live and available to students!',
      rejected: 'Your course needs revisions before it can be approved.'
    };
    return messages[status] || '';
  };

  const CourseCard = ({ course }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{course.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Category: {course.category_name || 'Uncategorized'}
            </p>
            <p className="text-sm text-gray-600">
              Level: {course.level}
            </p>
            <p className="text-sm text-gray-600">
              Created: {new Date(course.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(course.status)}
            {course.is_published && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Published
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4">
          {course.description || 'No description available'}
        </p>
        
        <div className="bg-gray-50 border rounded p-3 mb-4">
          <p className="text-sm font-medium text-gray-800">Status:</p>
          <p className="text-sm text-gray-600">{getStatusMessage(course.status)}</p>
        </div>
        
        {course.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm font-medium text-red-800">Feedback from Admin:</p>
            <p className="text-sm text-red-700">{course.rejection_reason}</p>
          </div>
        )}
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
          >
            Edit Course
          </Button>
          
          {course.status === 'approved' && (
            <Button
              onClick={() => navigate(`/courses/${course.id}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              View Live Course
            </Button>
          )}
          
          {course.status === 'rejected' && (
            <Button
              onClick={() => handleResubmitCourse(course.id)}
              disabled={actionLoading === course.id}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === course.id ? 'Resubmitting...' : 'Resubmit for Review'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const filterCoursesByStatus = (status) => {
    return courses.filter(course => course.status === status);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading your courses...</div>
        </div>
      </div>
    );
  }

  const pendingCourses = filterCoursesByStatus('pending');
  const approvedCourses = filterCoursesByStatus('approved');
  const rejectedCourses = filterCoursesByStatus('rejected');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <Button
          onClick={() => navigate('/instructor/courses/new')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Create New Course
        </Button>
      </div>
      
      {courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
              <Button
                onClick={() => navigate('/instructor/courses/new')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Your First Course
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All Courses ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingCourses.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedCourses.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedCourses.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </TabsContent>
          
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
          
          <TabsContent value="approved" className="mt-6">
            {approvedCourses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No approved courses</p>
                </CardContent>
              </Card>
            ) : (
              approvedCourses.map(course => (
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
                <CourseCard key={course.id} course={course} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default InstructorCourseStatus;