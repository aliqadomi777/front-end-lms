import React, { useState } from "react";
import Layout from "@/components/Layout";
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
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Shield,
  Settings,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Download,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { useUsers, useCourses, usePendingCourses, useApproveCourse, useUpdateUserRole, useDeleteUser } from "@/hooks/useApi";
import UserManagementDialog from "@/components/UserManagementDialog";
import { useAuth } from '@/context/AuthContext'; // Add this import

const AdminPanel = () => {
  const { user } = useAuth();
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  
  // User management dialog state
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogAction, setDialogAction] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  

  
  // Only fetch pending courses if user is admin and authenticated
  const { data: pendingCoursesData, isLoading: pendingLoading, error: pendingError } = usePendingCourses({
    enabled: user?.role === 'admin' && !!user?.id
  });
  

  
  const approveCourse = useApproveCourse();

  const users = usersData?.data?.users || [];
  const courses = coursesData?.data?.courses || [];
  // Try different possible response structures and ensure it's always an array
  let pendingCourses = pendingCoursesData?.data?.courses || pendingCoursesData?.data || [];
  
  // Ensure pendingCourses is always an array
  if (!Array.isArray(pendingCourses)) {
    pendingCourses = [];
  }

  // Calculate dynamic stats
  const instructors = users.filter(user => user.role === 'instructor');
  const totalRevenue = 0;
  
  const systemStats = {
    totalUsers: users.length,
    activeInstructors: instructors.length,
    totalCourses: courses.length,
    monthlyRevenue: totalRevenue,
    platformHealth: "Excellent", // This would need a separate API
  };

  // Get recent users (last 10)
  const recentUsers = users
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map(user => ({
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email,
      role: user.role || 'Student',
      joined: new Date(user.created_at).toLocaleDateString(),
      status: user.is_active ? 'Active' : 'Inactive',
    }));

  // Get top courses by enrollment
  const topCourses = courses
    .sort((a, b) => (b.enrolled_count || 0) - (a.enrolled_count || 0))
    .slice(0, 10)
    .map(course => ({
      id: course.id,
      title: course.title || 'Untitled Course',
      instructor: course.instructor_name || 'Unknown Instructor',
      students: course.enrolled_count || 0,
      revenue: 0,
    }));

  const isLoading = usersLoading || coursesLoading || pendingLoading;

  const handleCourseApproval = async (courseId, action) => {
    try {
      await approveCourse.mutateAsync({ id: courseId, action });
    } catch (error) {
      console.error('Error processing course approval:', error);
    }
  };

  // User management handlers
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setDialogAction('edit');
    setIsDialogOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDialogAction('delete');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setDialogAction(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      message: "Server CPU usage above 80%",
      time: "10 minutes ago",
    },
    {
      id: 2,
      type: "info",
      message: "Scheduled maintenance tonight at 2 AM",
      time: "2 hours ago",
    },
    {
      id: 3,
      type: "success",
      message: "Database backup completed successfully",
      time: "6 hours ago",
    },
  ];

  const getAlertIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Layout userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage users, monitor system health, and analyze platform
              performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemStats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+89 new this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Instructors
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemStats.activeInstructors}
              </div>
              <p className="text-xs text-muted-foreground">
                +12 new this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Courses
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemStats.totalCourses}
              </div>
              <p className="text-xs text-muted-foreground">
                +8 added this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${systemStats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +23% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Health
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {systemStats.platformHealth}
              </div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="approvals">Course Approvals</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent User Registrations</CardTitle>
                  <CardDescription>
                    New users who joined the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{user.role}</Badge>
                          <Badge
                            variant={
                              user.status === "Active" ? "default" : "secondary"
                            }
                          >
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          title="Edit user role"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteUser(user)}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                  <CardDescription>
                    Breakdown of user roles and activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      User statistics visualization
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Chart showing user distribution by role
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          <TabsContent value="approvals" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Approval Center
                  </CardTitle>
                  <CardDescription>
                    Review and approve courses uploaded by instructors. Ensure content quality and platform standards.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                      <p className="text-muted-foreground">No pending courses for approval at the moment.</p>
                      <p className="text-sm text-muted-foreground mt-2">New course submissions will appear here for review.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Review Guidelines</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Please review course content, description, and ensure it meets platform quality standards before approval.
                        </p>
                      </div>
                      {pendingCourses.map((course) => (
                        <div
                          key={course.id}
                          className="p-6 border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div>
                                <h3 className="text-lg font-semibold text-900">{course.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Submitted by <span className="font-medium">{course.instructor_name || 'Unknown Instructor'}</span>
                                </p>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{course.category}</Badge>
                                <Badge variant="outline">{course.level}</Badge>
                                <Badge variant="secondary">Free Course</Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Course Description:</h4>
                                <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                                  {course.description || 'No description provided'}
                                </p>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                Submitted: {new Date(course.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-6">
                              <Button
                                size="sm"
                                onClick={() => handleCourseApproval(course.id, 'approve')}
                                disabled={approveCourse.isPending}
                                className="bg-green-600 hover:bg-green-700 min-w-[100px]"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCourseApproval(course.id, 'reject')}
                                disabled={approveCourse.isPending}
                                className="min-w-[100px]"
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>
                    Platform revenue trends and projections
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Revenue analytics dashboard
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Monthly and yearly revenue tracking
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>
                    Platform usage and engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Engagement analytics
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Course completion rates and user activity
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>
                    Recent system notifications and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>
                    Server metrics and performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>68%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "68%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>54%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: "54%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Storage Usage</span>
                      <span>72%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: "72%" }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* User Management Dialog */}
      <UserManagementDialog
        user={selectedUser}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        action={dialogAction}
      />
    </Layout>
  );
};

export default AdminPanel;
