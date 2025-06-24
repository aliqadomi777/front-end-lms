import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  PlayCircle,
  BookOpen,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useApprovedCourses, useEnrollCourse, useEnrolledCourses } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

const StudentCourseEnrollment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;

  // Build query parameters
  const queryParams = {
    page: currentPage,
    limit,
    ...(searchTerm && { search: searchTerm }),
    ...(selectedCategory !== 'all' && { category: selectedCategory }),
    ...(selectedLevel !== 'all' && { level: selectedLevel }),
  };

  const { data: coursesData, isLoading, error } = useApprovedCourses(queryParams);
  const { data: enrolledCoursesData } = useEnrolledCourses();
  const enrollCourseMutation = useEnrollCourse();

  const courses = coursesData?.data?.courses || [];
  const pagination = coursesData?.data?.pagination || {};
  const enrolledCourses = enrolledCoursesData?.data?.enrollments || enrolledCoursesData?.data || [];
  const enrolledCourseIds = Array.isArray(enrolledCourses) 
    ? enrolledCourses.map(enrollment => enrollment.course_id || enrollment.id) 
    : [];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'devops', label: 'DevOps' },
    { value: 'design', label: 'Design' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'data_science', label: 'Data Science' },
  ];

  const levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      frontend: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      backend: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      devops: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      design: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      mobile: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      data_science: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      toast.error('Please log in to enroll in courses');
      navigate('/login');
      return;
    }

    try {
      await enrollCourseMutation.mutateAsync(courseId);
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Courses</h2>
            <p className="text-muted-foreground mb-4">
              {error?.response?.data?.message || error?.message || 'Failed to load courses'}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Available Courses</h1>
          <p className="text-muted-foreground">
            Discover and enroll in approved courses to advance your skills
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search courses, instructors, or topics..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" variant="outline">
                    Search
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {!isLoading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {courses.length} of {pagination.total || 0} courses
            </p>
            {pagination.totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Page {pagination.page || 1} of {pagination.totalPages}
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or browse all courses.
                </p>
              </div>
            ) : (
              courses.map((course) => {
                const isEnrolled = enrolledCourseIds.includes(course.id);
                return (
                  <Card key={course.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getCategoryColor(course.category)}>
                          {course.category || 'General'}
                        </Badge>
                        <Badge className={getLevelColor(course.level)} variant="secondary">
                          {course.level || 'Beginner'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {course.title || 'Untitled Course'}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        by {course.instructor_name || 'Unknown Instructor'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {course.description}
                          </p>
                        )}
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
                        {course.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{course.rating}</span>
                            <span className="text-sm text-muted-foreground">
                              ({course.review_count || 0} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {isEnrolled ? (
                        <Button 
                          onClick={() => navigate(`/student/course/${course.id}`)}
                          className="w-full"
                          variant="outline"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollCourseMutation.isPending}
                          className="w-full"
                        >
                          {enrollCourseMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Enroll Now
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentCourseEnrollment;