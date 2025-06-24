

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { authAPI, courseAPI } from "@/lib/api";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Eye,
  BarChart3,
  Users,
  BookOpen,
  Star,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  Video,
  Settings,
  Download,
} from "lucide-react";

const InstructorPanel = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalRevenue: 0,

    coursesPublished: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Fetch instructor data
  const fetchInstructorData = async () => {
    try {
      setLoading(true);
      
      // Fetch current user
        const userResponse = await authAPI.getProfile();
        if (userResponse.success) {
          setUser(userResponse.data);
        }

      // Fetch instructor courses
        const coursesResponse = await courseAPI.getInstructorCourses();
        if (coursesResponse.success) {
           setCourses(coursesResponse.data || []);
         }

        // Fetch instructor analytics
        const analyticsResponse = await api.get('/instructor/analytics');
        if (analyticsResponse.success) {
          setAnalytics(analyticsResponse.data || analytics);
        }

        // Fetch recent activity
        const activityResponse = await api.get('/instructor/activity');
        if (activityResponse.success) {
          setRecentActivity(activityResponse.data || []);
        }

        // Fetch pending tasks
        const tasksResponse = await api.get('/instructor/tasks');
        if (tasksResponse.success) {
          setPendingTasks(tasksResponse.data || []);
        }

    } catch (error) {
      console.error('Error fetching instructor data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorData();
  }, []);
  // Loading state component
  if (loading) {
    return (
      <Layout userRole="instructor" userName={user?.name || "Instructor"} userEmail={user?.email || ""}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading instructor panel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      userRole="instructor" 
      userName={user?.name || user?.email || "Instructor"}
      userEmail={user?.email || ""}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Instructor Panel</h1>
            <p className="text-muted-foreground">
              Manage your courses, track performance, and engage with students
            </p>
          </div>
          <Button onClick={() => navigate('/instructor/add-course')}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Course
            </Button>
        </div>

        {/* Analytics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              id: 'total-students',
              title: 'Total Students',
              value: analytics.totalStudents,
              change: '+12% from last month',
              icon: Users
            },
            {
              id: 'total-revenue',
              title: 'Total Revenue',
              value: `$${analytics.totalRevenue}`,
              change: '+18% from last month',
              icon: DollarSign
            },
            {
              id: 'published-courses',
              title: 'Published Courses',
              value: analytics.coursesPublished,
              change: '1 in draft',
              icon: BookOpen
            },
            {
              id: 'average-rating',
              title: 'Average Rating',
              value: '4.8',
              change: '+0.2 from last month',
              icon: Star
            }
          ].map((metric) => {
            const IconComponent = metric.icon;
            return (
              <Card key={metric.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.value}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metric.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid gap-6">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <Card key={course.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {course.title}
                            </h3>
                            <Badge
                              variant={
                                course.status === "Published" || course.status === "published"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {course.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {course.enrollments || course.students || 0} students
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Updated {course.lastUpdated || course.updated_at || course.created_at}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Analytics
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/instructor/course/${course.id}/content`)}
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            Manage Content
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first course to start teaching
                      </p>
                      <Button onClick={() => navigate('/instructor/add-course')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Course
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>
                    Monthly revenue over the last 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Revenue chart visualization
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Chart.js integration coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Engagement</CardTitle>
                  <CardDescription>
                    Course completion and engagement rates
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Engagement metrics</p>
                    <p className="text-sm text-muted-foreground">
                      Analytics dashboard coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>
                  View and manage your enrolled students
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Student management interface
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Features include messaging, progress tracking, and grading
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Tasks</CardTitle>
                  <CardDescription>
                    Items requiring your attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingTasks.length > 0 ? (
                    pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{task.task || task.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {task.course || task.course_title}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            Due {task.due || task.due_date}
                          </Badge>
                          <br />
                          <Button size="sm">Complete</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No pending tasks</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates from your courses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex space-x-3">
                        <div className="rounded-full p-2 bg-primary/10 text-primary">
                          {activity.type === "enrollment" ? (
                            <Users className="h-4 w-4" />
                          ) : activity.type === "review" ? (
                            <Star className="h-4 w-4" />
                          ) : activity.type === "question" ? (
                            <FileText className="h-4 w-4" />
                          ) : null}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.time || activity.created_at}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default InstructorPanel;
