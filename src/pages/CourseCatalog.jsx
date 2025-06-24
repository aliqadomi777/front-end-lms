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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  PlayCircle,
} from "lucide-react";
import { useApprovedCourses, useEnrollCourse, useEnrolledCourses } from "@/hooks/useApi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const CourseCatalog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: coursesData, isLoading, error } = useApprovedCourses();
  const { data: enrolledCoursesData, isLoading: enrolledLoading } = useEnrolledCourses();
  const enrollCourseMutation = useEnrollCourse();
  
  // Check if we're on the My Courses page
  const isMyCoursesPage = location.pathname === '/my-courses';
  
  const allCourses = Array.isArray(coursesData?.data?.courses) ? coursesData.data.courses : [];
  const enrolledCourses = Array.isArray(enrolledCoursesData?.data) ? enrolledCoursesData.data : [];
  // Map enrollment data to course IDs - enrollment data has course_id field
  const enrolledCourseIds = enrolledCourses.map(enrollment => enrollment.course_id);
  
  console.log('Enrolled courses data:', enrolledCourses);
  console.log('Enrolled course IDs:', enrolledCourseIds);
  
  // Show only enrolled courses on My Courses page, all approved courses on catalog page
  // For My Courses page, we need to transform enrollment data to course-like structure
  const enrolledCoursesForDisplay = enrolledCourses.map(enrollment => ({
    id: enrollment.course_id,
    title: enrollment.course_title,
    instructor_name: enrollment.instructor_name,
    level: enrollment.level || 'Beginner',
    duration: enrollment.duration || 'Self-paced',
    enrolled_count: enrollment.enrolled_count || 0,
    progress: enrollment.progress || 0
  }));
  
  const courses = isMyCoursesPage ? enrolledCoursesForDisplay : allCourses;
  


  // Categories would need a separate API endpoint
  // For now, we'll comment out the categories section

  const getLevelColor = (level) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };



  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {isMyCoursesPage ? 'My Courses' : 'Course Catalog'}
          </h1>
          <p className="text-muted-foreground">
            {isMyCoursesPage 
              ? 'Continue learning with your enrolled courses'
              : 'Discover and enroll in courses to advance your skills'
            }
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="course-search"
                  name="courseSearch"
                  placeholder="Search courses, instructors, or topics..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {/* Categories filter would be implemented when categories API is available */}
                <Select>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="programming">Programming</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
    
                    <SelectItem value="newest">Newest</SelectItem>

                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {(isMyCoursesPage ? enrolledLoading : isLoading) && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {isMyCoursesPage ? 'Loading your courses...' : 'Loading courses...'}
              </p>
            </div>
          </div>
        )}

        {/* Course Grid */}
        {!(isMyCoursesPage ? enrolledLoading : isLoading) && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  {isMyCoursesPage 
                    ? 'You haven\'t enrolled in any courses yet. Visit the course catalog to get started!'
                    : 'No courses available at the moment.'
                  }
                </p>
                {isMyCoursesPage && (
                  <Button 
                    onClick={() => navigate('/courses')} 
                    className="mt-4"
                    variant="outline"
                  >
                    Browse Course Catalog
                  </Button>
                )}
              </div>
            ) : (
              courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="text-3xl mb-2">📚</div>
                      <Badge
                        className={getLevelColor(course.level || 'Beginner')}
                        variant="secondary"
                      >
                        {course.level || 'Beginner'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      {course.title || 'Untitled Course'}
                    </CardTitle>
                    <CardDescription>by {course.instructor_name || 'Unknown Instructor'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration || 'Self-paced'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {(course.enrolled_count || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                      </div>
                      <div className="text-right">

                      </div>
                    </div>
                    {(isMyCoursesPage || enrolledCourseIds.includes(course.id)) ? (
                      <Button 
                        onClick={() => navigate(`/student/course/${course.id}`)}
                        className="w-full"
                        variant="outline"
                        size="sm"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => enrollCourseMutation.mutate(course.id)}
                        disabled={enrollCourseMutation.isPending}
                        className="w-full"
                        size="sm"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {enrollCourseMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Load More - Only show on course catalog page */}
        {!isMyCoursesPage && (
          <div className="text-center">
            <Button variant="outline" size="lg">
              Load More Courses
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseCatalog;
