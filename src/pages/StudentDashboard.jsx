

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Clock,
  Trophy,
  Bell,
  FileText,
  PlayCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  useEnrolledCourses,
  useAssignments,
  useNotifications,
  useEnrollmentProgress,
} from '@/hooks/useApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch student data using hooks
  const { data: enrolledCoursesData, isLoading: coursesLoading, error: coursesError } = useEnrolledCourses();
  const { data: assignmentsData, isLoading: assignmentsLoading } = useAssignments({ status: 'pending' });
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications();



  const enrolledCourses = Array.isArray(enrolledCoursesData?.data?.data) ? enrolledCoursesData.data.data : Array.isArray(enrolledCoursesData?.data) ? enrolledCoursesData.data : Array.isArray(enrolledCoursesData) ? enrolledCoursesData : [];
  const pendingAssignments = Array.isArray(assignmentsData?.data?.data) ? assignmentsData.data.data : Array.isArray(assignmentsData?.data) ? assignmentsData.data : Array.isArray(assignmentsData) ? assignmentsData : [];
  const notifications = Array.isArray(notificationsData?.data?.data) ? notificationsData.data.data : Array.isArray(notificationsData?.data) ? notificationsData.data : Array.isArray(notificationsData) ? notificationsData : [];



  // Calculate overall progress
  const totalCourses = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(course => course.progress === 100).length;
  const overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  // Show error state if there's an error fetching courses
  if (coursesError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Courses</h2>
            <p className="text-muted-foreground mb-4">
              {coursesError?.response?.data?.message || coursesError?.message || 'Failed to load enrolled courses'}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (coursesLoading || assignmentsLoading || notificationsLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Track your learning progress and manage your courses
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCourses}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedCourses}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingAssignments.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallProgress}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Continue Learning</CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enrolledCourses.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{course.title}</h4>
                        <Progress value={course.progress || 0} className="mt-2" />
                        <p className="text-sm text-muted-foreground mt-1">
                          {course.progress || 0}% complete
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/student/course/${course.id}`)}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Continue
                      </Button>
                    </div>
                  ))}
                  {enrolledCourses.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No enrolled courses yet. Browse the course catalog to get started!
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>Don't miss these assignments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingAssignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                  {pendingAssignments.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No pending assignments
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Courses</h2>
              <Button onClick={() => navigate('/courses')}>Browse More Courses</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <Card key={course.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/student/course/${course.id}`)}>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={course.progress || 0} />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{course.progress || 0}% complete</span>
                        <span>{course.instructor_name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <h2 className="text-2xl font-bold">Assignments</h2>
            
            <div className="space-y-4">
              {pendingAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription>{assignment.course_title}</CardDescription>
                      </div>
                      <Badge variant={assignment.status === 'pending' ? 'destructive' : 'default'}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {assignment.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                      <Button size="sm">
                        View Assignment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <h2 className="text-2xl font-bold">Notifications</h2>
            
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className={!notification.is_read ? 'border-blue-200' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4" />
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{notification.message}</p>
                  </CardContent>
                </Card>
              ))}
              {notifications.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No notifications yet
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default StudentDashboard;