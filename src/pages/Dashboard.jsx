

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  Trophy,
  Clock,
  TrendingUp,
  Calendar,
  PlayCircle,
  FileText,
  Award,
  BarChart3,
  UserPlus,
  Settings,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCourses, useEnrolledCourses, useAssignments } from "@/hooks/useApi";

const Dashboard = () => {
  const [userRole, setUserRole] = useState(undefined);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { data: enrolledCourses, isLoading: coursesLoading } =
    useEnrolledCourses();
  const { data: allCourses } = useCourses();
  const { data: assignments } = useAssignments();

  useEffect(() => {
    if (user?.role) {
      setUserRole(user.role);
    }
  }, [user]);



  if (isLoading) return <div className="p-10">Loading…</div>;
  if (!userRole) return <Navigate to="/login" replace />; // not logged in

  // Calculate student data from API responses
  const studentData = {
    enrolledCourses: enrolledCourses?.data?.length || 0,
    completedCourses:
      enrolledCourses?.data?.filter((course) => course.progress === 100)
        ?.length || 0,
    totalProgress:
      enrolledCourses?.data?.length > 0
        ? Math.round(
            enrolledCourses.data.reduce(
              (acc, course) => acc + (course.progress || 0),
              0,
            ) / enrolledCourses.data.length,
          )
        : 0,
    certificates:
      enrolledCourses?.data?.filter((course) => course.progress === 100)
        ?.length || 0,
    recentCourses:
      enrolledCourses?.data?.slice(0, 3).map((course) => ({
        id: course.id,
        title: course.title || "Untitled Course",
        progress: course.progress || 0,
        instructor: course.instructor_name || "Unknown Instructor",
        thumbnail: "📚",
      })) || [],
    upcomingAssignments:
      assignments?.data
        ?.filter((assignment) => !assignment.submitted)
        ?.slice(0, 2)
        .map((assignment) => ({
          id: assignment.id,
          title: assignment.title || "Untitled Assignment",
          due: assignment.due_date || "No due date",
          course: assignment.course_title || "Unknown Course",
        })) || [],
  };

  // Calculate instructor data from API responses
  const instructorCourses =
    allCourses?.data?.filter((course) => course.instructor_id === user?.id) ||
    [];
  const instructorData = {
    activeCourses: instructorCourses.length,
    totalStudents: instructorCourses.reduce(
      (acc, course) => acc + (course.enrolled_count || 0),
      0,
    ),

    monthlyEarnings: instructorCourses.reduce(
      (acc, course) => acc + (course.revenue || 0),
      0,
    ),
    courses: instructorCourses.slice(0, 2).map((course) => ({
      id: course.id,
      title: course.title || "Untitled Course",
      students: course.enrolled_count || 0,

      revenue: course.revenue || 0,
    })),
    recentActivity: [
      // This would need a separate API call for activity feed
      // For now, showing placeholder until activity API is implemented
    ],
  };

  // Calculate admin data from API responses
  const adminData = {
    totalUsers: 0, // Would need users API call
    activeCourses: allCourses?.data?.length || 0,
    monthlyRevenue:
      allCourses?.data?.reduce(
        (acc, course) => acc + (course.revenue || 0),
        0,
      ) || 0,
    newSignups: 0, // Would need users API with date filter
    recentMetrics: [
      { label: "Course Completion Rate", value: "N/A", trend: "N/A" },
      { label: "User Satisfaction", value: "N/A", trend: "N/A" },
      { label: "Platform Uptime", value: "99.9%", trend: "stable" },
    ],
    topCourses:
      allCourses?.data
        ?.sort((a, b) => (b.enrolled_count || 0) - (a.enrolled_count || 0))
        .slice(0, 2)
        .map((course) => ({
          id: course.id,
          title: course.title || "Untitled Course",
          enrollments: course.enrolled_count || 0,
          revenue: course.revenue || 0,
        })) || [],
  };

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentData.enrolledCourses}
            </div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentData.completedCourses}
            </div>
            <p className="text-xs text-muted-foreground">40% completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentData.totalProgress}%
            </div>
            <Progress value={studentData.totalProgress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.certificates}</div>
            <p className="text-xs text-muted-foreground">Earned this year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Continue Learning */}
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentData.recentCourses.map((course) => (
              <div key={course.id} className="flex items-center space-x-4">
                <div className="text-2xl">{course.thumbnail}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {course.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {course.instructor}
                  </p>
                  <Progress value={course.progress} className="h-2" />
                </div>
                <Button size="sm" variant="outline">
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Continue
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>Don't miss these deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentData.upcomingAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.course}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    Due {assignment.due}
                  </Badge>
                  <br />
                  <Button size="sm" variant="default">
                    Submit
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInstructorDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructorData.activeCourses}
            </div>
            <p className="text-xs text-muted-foreground">+1 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructorData.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">+23 new enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Earnings
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${instructorData.monthlyEarnings}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Your top performing courses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructorData.courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.students} students
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${course.revenue}</p>
                  <p className="text-xs text-muted-foreground">this month</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your courses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructorData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex space-x-3">
                <div
                  className={cn(
                    "rounded-full p-2",
                    activity.type === "assignment"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-yellow-100 text-yellow-600",
                  )}
                >
                  {activity.type === "assignment" ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{adminData.newSignups} new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminData.activeCourses}</div>
            <p className="text-xs text-muted-foreground">+5 added this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${adminData.monthlyRevenue}
            </div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Health
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Excellent</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Platform Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminData.recentMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <Badge
                  variant={metric.trend.includes("+") ? "default" : "secondary"}
                >
                  {metric.trend}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Courses</CardTitle>
            <CardDescription>Courses with highest engagement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminData.topCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.enrollments} enrollments
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${course.revenue}</p>
                  <p className="text-xs text-muted-foreground">revenue</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // In the Dashboard component, pass user data to Layout
  return (
    <Layout
      userRole={userRole}
      userName={user?.name || user?.username}
      userEmail={user?.email}
      showSidebar={true}
    >
      {userRole === "student" && renderStudentDashboard()}
      {userRole === "instructor" && renderInstructorDashboard()}
      {userRole === "admin" && renderAdminDashboard()}{" "}
    </Layout>
  );
};

export default Dashboard;
