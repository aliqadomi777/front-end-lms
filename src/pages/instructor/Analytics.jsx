import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  HeatMapChart,
} from "recharts";
import { useState, useRef, useEffect } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import EmptyState from "../../components/EmptyState";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
];

const assessmentTypes = [
  { value: "both", label: "All Assessments" },
  { value: "quiz", label: "Quizzes" },
  { value: "assignment", label: "Assignments" },
];

// Debounce utility
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const Analytics = () => {
  const { token } = useAuth();
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [drilldownCourse, setDrilldownCourse] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [assessmentType, setAssessmentType] = useState("both");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const studentModalRef = useRef(null);
  const assessmentModalRef = useRef(null);
  const [showBanner, setShowBanner] = useState(true);

  // Focus management for modals
  useEffect(() => {
    if (studentModalOpen && studentModalRef.current) {
      studentModalRef.current.focus();
    }
  }, [studentModalOpen]);
  useEffect(() => {
    if (assessmentModalOpen && assessmentModalRef.current) {
      assessmentModalRef.current.focus();
    }
  }, [assessmentModalOpen]);

  // Keyboard navigation for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (studentModalOpen) setStudentModalOpen(false);
        if (assessmentModalOpen) setAssessmentModalOpen(false);
      }
    };
    if (studentModalOpen || assessmentModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [studentModalOpen, assessmentModalOpen]);

  // Site-wide stats
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["instructor-dashboard-analytics"],
    queryFn: async () => {
      const res = await axios.get(`/api/analytics/instructor/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    },
    enabled: !!token,
  });

  // Enrollment trends (for instructor's courses)
  const {
    data: enrollmentTrends,
    isLoading: loadingTrends,
    isError: errorTrends,
    refetch: refetchTrends,
  } = useQuery({
    queryKey: [
      "instructor-enrollment-trends",
      dateFrom,
      dateTo,
      selectedCourses,
    ],
    queryFn: async () => {
      const res = await axios.get(`/api/analytics/trends/enrollment`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          course_id: selectedCourses.length
            ? selectedCourses.join(",")
            : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      });
      return res.data.data;
    },
    enabled: !!token,
  });

  // Engagement trends (for instructor's courses)
  const {
    data: engagementTrends,
    isLoading: loadingEngagement,
    isError: errorEngagement,
    refetch: refetchEngagement,
  } = useQuery({
    queryKey: [
      "instructor-engagement-trends",
      dateFrom,
      dateTo,
      selectedCourses,
    ],
    queryFn: async () => {
      const res = await axios.get(`/api/analytics/engagement/weekly`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          course_id: selectedCourses.length
            ? selectedCourses.join(",")
            : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      });
      return res.data.data;
    },
    enabled: !!token,
  });

  // Top students (for instructor's courses)
  const {
    data: topStudents,
    isLoading: loadingTopStudents,
    isError: errorTopStudents,
    refetch: refetchTopStudents,
  } = useQuery({
    queryKey: ["instructor-top-students", dateFrom, dateTo, selectedCourses],
    queryFn: async () => {
      const res = await axios.get(`/api/analytics/students/top`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          course_id: selectedCourses.length
            ? selectedCourses.join(",")
            : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          metric: "overall_score",
        },
      });
      return res.data.data;
    },
    enabled: !!token,
  });

  // Fetch all instructor's courses for comparison
  const {
    data: myCoursesData,
    isLoading: loadingMyCourses,
    isError: errorMyCourses,
  } = useQuery({
    queryKey: ["instructor-courses-list"],
    queryFn: async () => {
      const res = await axios.get(`/api/courses/instructor/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.courses || [];
    },
    enabled: !!token,
  });
  const myCourses = myCoursesData || [];

  // Course stats for comparison
  const {
    data: courseStats,
    isLoading: loadingCourseStats,
    isError: errorCourseStats,
  } = useQuery({
    queryKey: ["instructor-course-stats", selectedCourses, dateFrom, dateTo],
    queryFn: async () => {
      if (!selectedCourses.length) return [];
      return Promise.all(
        selectedCourses.map((id) =>
          axios
            .get(`/api/analytics/courses/${id}/stats`, {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
              },
            })
            .then((res) => res.data.data)
        )
      );
    },
    enabled: !!token && selectedCourses.length > 0,
  });

  // Drill-down: course students
  const {
    data: courseStudents,
    isLoading: loadingCourseStudents,
    isError: errorCourseStudents,
  } = useQuery({
    queryKey: [
      "instructor-course-students",
      drilldownCourse,
      dateFrom,
      dateTo,
      studentSearch,
    ],
    queryFn: async () => {
      if (!drilldownCourse) return [];
      const res = await axios.get(
        `/api/analytics/courses/${drilldownCourse}/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            search: studentSearch || undefined,
          },
        }
      );
      return res.data.data;
    },
    enabled: !!token && !!drilldownCourse,
  });

  // Lesson completion heatmap
  const {
    data: lessonHeatmap,
    isLoading: loadingHeatmap,
    isError: errorHeatmap,
  } = useQuery({
    queryKey: ["instructor-lesson-heatmap", drilldownCourse, dateFrom, dateTo],
    queryFn: async () => {
      if (!drilldownCourse) return null;
      const res = await axios.get(`/api/analytics/lessons/completion-heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          course_id: drilldownCourse,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      });
      return res.data.data;
    },
    enabled: !!token && !!drilldownCourse,
  });

  // Assessment stats for course
  const {
    data: assessmentStats,
    isLoading: loadingAssessment,
    isError: errorAssessment,
  } = useQuery({
    queryKey: [
      "instructor-assessment-stats",
      drilldownCourse,
      dateFrom,
      dateTo,
      assessmentType,
    ],
    queryFn: async () => {
      if (!drilldownCourse) return null;
      const res = await axios.get(`/api/analytics/assessments/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          course_id: drilldownCourse,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          type: assessmentType,
        },
      });
      return res.data.data;
    },
    enabled: !!token && !!drilldownCourse,
  });

  // Grade distribution for course
  const {
    data: gradeDistribution,
    isLoading: loadingGradeDistribution,
    isError: errorGradeDistribution,
  } = useQuery({
    queryKey: [
      "instructor-grade-distribution",
      drilldownCourse,
      dateFrom,
      dateTo,
      assessmentType,
    ],
    queryFn: async () => {
      if (!drilldownCourse) return null;
      const res = await axios.get(`/api/analytics/reports/grades`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          course_id: drilldownCourse,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          assessment_type: assessmentType,
        },
      });
      return res.data.data;
    },
    enabled: !!token && !!drilldownCourse,
  });

  // Real-time dashboard
  const {
    data: realtime,
    isLoading: loadingRealtime,
    isError: errorRealtime,
  } = useQuery({
    queryKey: ["instructor-realtime-dashboard", selectedCourses],
    queryFn: async () => {
      const res = await axios.get(`/api/analytics/realtime/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          course_id: selectedCourses.length
            ? selectedCourses.join(",")
            : undefined,
        },
      });
      return res.data.data;
    },
    enabled: !!token,
  });

  // Drill-down: fetch selected student analytics
  const {
    data: studentDrilldown,
    isLoading: loadingStudentDrilldown,
    isError: errorStudentDrilldown,
    refetch: refetchStudentDrilldown,
  } = useQuery({
    queryKey: [
      "student-drilldown",
      selectedStudent,
      dateFrom,
      dateTo,
      drilldownCourse,
    ],
    queryFn: async () => {
      if (!selectedStudent) return null;
      const res = await axios.get(
        `/api/analytics/students/${selectedStudent}/performance`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            course_id: drilldownCourse || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            include_details: true,
          },
        }
      );
      return res.data.data;
    },
    enabled: !!token && !!selectedStudent,
  });

  // Drill-down: fetch selected assessment analytics
  const {
    data: assessmentDrilldown,
    isLoading: loadingAssessmentDrilldown,
    isError: errorAssessmentDrilldown,
    refetch: refetchAssessmentDrilldown,
  } = useQuery({
    queryKey: [
      "assessment-drilldown",
      selectedAssessment,
      drilldownCourse,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      if (!selectedAssessment) return null;
      const res = await axios.get(`/api/analytics/reports/grades`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          course_id: drilldownCourse || undefined,
          assessment_type: selectedAssessment.type,
          assessment_id: selectedAssessment.id,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          include_details: true,
        },
      });
      return res.data.data;
    },
    enabled: !!token && !!selectedAssessment,
  });

  // Export analytics
  const handleExport = async (type) => {
    let url = "";
    if (type === "course-students" && drilldownCourse) {
      url = `/api/analytics/courses/${drilldownCourse}/students?format=csv`;
    } else if (type === "assessment-stats" && drilldownCourse) {
      url = `/api/analytics/assessments/stats?course_id=${drilldownCourse}&format=csv`;
    }
    if (!url) return;
    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `${type}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // Show error toast if needed
    }
  };

  const debouncedSetStudentSearch = useRef(
    debounce((value) => {
      setStudentSearch(value);
    }, 400)
  ).current;

  if (isLoading) {
    return <LoadingSkeleton lines={8} className="mt-10 max-w-2xl mx-auto" />;
  }
  if (isError) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center">
        <p className="text-red-500 mb-4">
          {error?.response?.data?.message || error.message}
        </p>
        <PrimaryButton onClick={() => refetch()}>Retry</PrimaryButton>
      </div>
    );
  }
  if (!data) {
    return (
      <EmptyState
        message="No analytics data found."
        className="max-w-xl mx-auto mt-10"
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10">
      {showBanner && (
        <Panel className="bg-blue-50 border border-blue-200 rounded shadow p-4 mb-8 flex items-center justify-between transition-all">
          <span className="text-blue-800 font-medium">
            Welcome to your analytics dashboard! Use the filters below to
            explore your course, student, and assessment data. Need help? See
            the documentation.
          </span>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-4 px-2 py-1 text-blue-700 hover:text-white hover:bg-blue-600 rounded focus:outline-none focus:ring transition"
            aria-label="Dismiss info banner"
          >
            ×
          </button>
        </Panel>
      )}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Enrollment Trends
        </h2>
        {loadingTrends ? (
          <LoadingSkeleton lines={4} />
        ) : errorTrends ? (
          <div className="text-red-500">Failed to load trends</div>
        ) : enrollmentTrends && enrollmentTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={enrollmentTrends}
              role="img"
              aria-label="Enrollment Trends Line Chart"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip contentStyle={{ fontSize: "0.95rem" }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No enrollment trend data for the selected period." />
        )}
      </Panel>
      {/* Weekly Engagement */}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Weekly Engagement
        </h2>
        {loadingEngagement ? (
          <LoadingSkeleton lines={4} />
        ) : errorEngagement ? (
          <div className="text-red-500">Failed to load engagement</div>
        ) : engagementTrends && engagementTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={engagementTrends}
              role="img"
              aria-label="Weekly Engagement Line Chart"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip contentStyle={{ fontSize: "0.95rem" }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No engagement data for the selected period." />
        )}
      </Panel>
      {/* Top Students */}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Top Students
        </h2>
        {loadingTopStudents ? (
          <LoadingSkeleton lines={4} />
        ) : errorTopStudents ? (
          <div className="text-red-500">Failed to load top students</div>
        ) : topStudents && topStudents.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topStudents}
              role="img"
              aria-label="Top Students Bar Chart"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ fontSize: "0.95rem" }} />
              <Legend />
              <Bar dataKey="overall_score" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No top students data available." />
        )}
      </Panel>
      {/* Course Comparison */}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Course Comparison
        </h2>
        {loadingMyCourses ? (
          <LoadingSkeleton lines={4} />
        ) : errorMyCourses ? (
          <div className="text-red-500">Failed to load course data</div>
        ) : myCourses && myCourses.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={myCourses}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="enrollments"
              >
                {myCourses.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No course data available." />
        )}
      </Panel>
      {/* Course Stats */}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Course Stats
        </h2>
        {loadingCourseStats ? (
          <LoadingSkeleton lines={4} />
        ) : errorCourseStats ? (
          <div className="text-red-500">Failed to load course stats</div>
        ) : courseStats && courseStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={courseStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {courseStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No course stats data available." />
        )}
      </Panel>
      {/* Course Students */}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Course Students
        </h2>
        {loadingCourseStudents ? (
          <LoadingSkeleton lines={4} />
        ) : errorCourseStudents ? (
          <div className="text-red-500">Failed to load course students</div>
        ) : courseStudents && courseStudents.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={courseStudents}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="overall_score"
                onClick={(_, idx) => {
                  const student = courseStudents[idx];
                  if (student) {
                    setSelectedStudent(student.id);
                    setStudentModalOpen(true);
                  }
                }}
              >
                {courseStudents.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No course students data available." />
        )}
      </Panel>
      {/* Lesson Completion Heatmap */}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Lesson Completion Heatmap
        </h2>
        {loadingHeatmap ? (
          <LoadingSkeleton lines={4} />
        ) : errorHeatmap ? (
          <div className="text-red-500">Failed to load lesson heatmap</div>
        ) : lessonHeatmap ? (
          <ResponsiveContainer width="100%" height={300}>
            <HeatMapChart
              data={lessonHeatmap}
              role="img"
              aria-label="Lesson Completion Heatmap"
            >
              <Tooltip />
              <XAxis
                dataKey="date"
                tickFormatter={(str) => {
                  const date = new Date(str);
                  return date.toLocaleDateString();
                }}
              />
              <YAxis
                dataKey="completion_percentage"
                tickFormatter={(value) => `${value}%`}
              />
              <HeatMapChart
                data={lessonHeatmap}
                rectWidth={20}
                rectHeight={20}
                dataKey="completion_percentage"
                fill={({ value }) => {
                  const percentage = value * 100;
                  if (percentage < 25) return COLORS[0];
                  if (percentage < 50) return COLORS[1];
                  if (percentage < 75) return COLORS[2];
                  return COLORS[3];
                }}
              />
            </HeatMapChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No lesson heatmap data available." />
        )}
      </Panel>
      {/* Assessment Stats */}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Assessment Stats
        </h2>
        {loadingAssessment ? (
          <LoadingSkeleton lines={4} />
        ) : errorAssessment ? (
          <div className="text-red-500">Failed to load assessment stats</div>
        ) : assessmentStats ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assessmentStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={(_, idx) => {
                  const assessment = assessmentStats[idx];
                  if (assessment) {
                    setSelectedAssessment({
                      id: assessment.id,
                      type: assessment.type || assessmentType,
                    });
                    setAssessmentModalOpen(true);
                  }
                }}
              >
                {assessmentStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No assessment stats data available." />
        )}
      </Panel>
      {/* Grade Distribution */}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Grade Distribution
        </h2>
        {loadingGradeDistribution ? (
          <LoadingSkeleton lines={4} />
        ) : errorGradeDistribution ? (
          <div className="text-red-500">Failed to load grade distribution</div>
        ) : gradeDistribution ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No grade distribution data available." />
        )}
      </Panel>
      {/* Real-time Dashboard */}
      <Panel className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Real-time Dashboard
        </h2>
        {loadingRealtime ? (
          <LoadingSkeleton lines={4} />
        ) : errorRealtime ? (
          <div className="text-red-500">Failed to load real-time data</div>
        ) : realtime ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={realtime}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {realtime.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No real-time data available." />
        )}
      </Panel>
      {/* Student Drill-down Modal */}
      {studentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-drilldown-title"
          tabIndex={-1}
        >
          <div
            className="bg-white rounded shadow-lg max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh] focus:outline-none"
            ref={studentModalRef}
            tabIndex={0}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:ring"
              onClick={() => setStudentModalOpen(false)}
              aria-label="Close"
              autoFocus
            >
              ×
            </button>
            <h2
              id="student-drilldown-title"
              className="text-2xl font-bold mb-4"
            >
              Student Analytics
            </h2>
            {loadingStudentDrilldown ? (
              <LoadingSkeleton lines={4} />
            ) : errorStudentDrilldown ? (
              <div className="text-red-500">
                Failed to load student analytics
              </div>
            ) : studentDrilldown ? (
              <div>
                <div className="mb-2 font-semibold">
                  Name: {studentDrilldown.name || selectedStudent}
                </div>
                <div className="mb-2">
                  Enrollments: {studentDrilldown.enrollments?.total ?? "-"}
                </div>
                <div className="mb-2">
                  Completion Rate:{" "}
                  {studentDrilldown.enrollments?.completion_rate ?? "-"}%
                </div>
                <div className="mb-2">
                  Average Quiz Score:{" "}
                  {studentDrilldown.quizzes?.average_score ?? "-"}
                </div>
                <div className="mb-2">
                  Assignments Submitted:{" "}
                  {studentDrilldown.assignments?.total_submissions ?? "-"}
                </div>
                <div className="mb-2">
                  Study Time: {studentDrilldown.study_time?.total_hours ?? "-"}{" "}
                  hours
                </div>
                {/* Per-assessment breakdown table */}
                {studentDrilldown.assessments &&
                  studentDrilldown.assessments.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">
                        Assessment Breakdown
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 border">Assessment</th>
                              <th className="px-2 py-1 border">Type</th>
                              <th className="px-2 py-1 border">Score</th>
                              <th className="px-2 py-1 border">Attempts</th>
                              <th className="px-2 py-1 border">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentDrilldown.assessments.map((a, i) => (
                              <tr key={i} className="even:bg-gray-50">
                                <td className="px-2 py-1 border">
                                  {a.name || a.id}
                                </td>
                                <td className="px-2 py-1 border">{a.type}</td>
                                <td className="px-2 py-1 border">
                                  {a.score ?? "-"}
                                </td>
                                <td className="px-2 py-1 border">
                                  {a.attempts ?? "-"}
                                </td>
                                <td className="px-2 py-1 border">
                                  {a.status || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                {/* Per-assessment chart (if data available) */}
                {studentDrilldown.assessments &&
                  studentDrilldown.assessments.length > 0 && (
                    <div className="mt-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={studentDrilldown.assessments}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="score" fill="#8884d8" name="Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                <button
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
                  onClick={async () => {
                    // Export logic as before
                    const url = `/api/analytics/students/${selectedStudent}/performance?format=csv&course_id=${
                      drilldownCourse || ""
                    }&date_from=${dateFrom || ""}&date_to=${dateTo || ""}`;
                    const res = await axios.get(url, {
                      headers: { Authorization: `Bearer ${token}` },
                      responseType: "blob",
                    });
                    const blobUrl = window.URL.createObjectURL(
                      new Blob([res.data])
                    );
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.setAttribute(
                      "download",
                      `student_${selectedStudent}_analytics.csv`
                    );
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  }}
                >
                  Export as CSV
                </button>
              </div>
            ) : (
              <EmptyState message="No analytics data for this student." />
            )}
          </div>
        </div>
      )}

      {/* Assessment Drill-down Modal */}
      {assessmentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assessment-drilldown-title"
          tabIndex={-1}
        >
          <div
            className="bg-white rounded shadow-lg max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh] focus:outline-none"
            ref={assessmentModalRef}
            tabIndex={0}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:ring"
              onClick={() => setAssessmentModalOpen(false)}
              aria-label="Close"
              autoFocus
            >
              ×
            </button>
            <h2
              id="assessment-drilldown-title"
              className="text-2xl font-bold mb-4"
            >
              Assessment Analytics
            </h2>
            {loadingAssessmentDrilldown ? (
              <LoadingSkeleton lines={4} />
            ) : errorAssessmentDrilldown ? (
              <div className="text-red-500">
                Failed to load assessment analytics
              </div>
            ) : assessmentDrilldown ? (
              <div>
                <div className="mb-2 font-semibold">
                  Assessment:{" "}
                  {assessmentDrilldown.name || selectedAssessment?.id}
                </div>
                <div className="mb-2">
                  Type: {assessmentDrilldown.type || selectedAssessment?.type}
                </div>
                <div className="mb-2">
                  Average Score: {assessmentDrilldown.average_score ?? "-"}
                </div>
                <div className="mb-2">
                  Attempts: {assessmentDrilldown.total_attempts ?? "-"}
                </div>
                <div className="mb-2">
                  Pass Rate: {assessmentDrilldown.pass_rate ?? "-"}%
                </div>
                {/* Per-student breakdown table */}
                {assessmentDrilldown.students &&
                  assessmentDrilldown.students.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">
                        Student Breakdown
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 border">Student</th>
                              <th className="px-2 py-1 border">Score</th>
                              <th className="px-2 py-1 border">Attempts</th>
                              <th className="px-2 py-1 border">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assessmentDrilldown.students.map((s, i) => (
                              <tr key={i} className="even:bg-gray-50">
                                <td className="px-2 py-1 border">
                                  {s.name || s.id}
                                </td>
                                <td className="px-2 py-1 border">
                                  {s.score ?? "-"}
                                </td>
                                <td className="px-2 py-1 border">
                                  {s.attempts ?? "-"}
                                </td>
                                <td className="px-2 py-1 border">
                                  {s.status || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                {/* Per-student chart (if data available) */}
                {assessmentDrilldown.students &&
                  assessmentDrilldown.students.length > 0 && (
                    <div className="mt-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={assessmentDrilldown.students}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="score" fill="#8884d8" name="Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                <button
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
                  onClick={async () => {
                    // Export logic as before
                    const url = `/api/analytics/reports/grades?format=csv&course_id=${
                      drilldownCourse || ""
                    }&assessment_type=${
                      selectedAssessment?.type || ""
                    }&assessment_id=${selectedAssessment?.id || ""}&date_from=${
                      dateFrom || ""
                    }&date_to=${dateTo || ""}`;
                    const res = await axios.get(url, {
                      headers: { Authorization: `Bearer ${token}` },
                      responseType: "blob",
                    });
                    const blobUrl = window.URL.createObjectURL(
                      new Blob([res.data])
                    );
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.setAttribute(
                      "download",
                      `assessment_${selectedAssessment?.id}_analytics.csv`
                    );
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  }}
                >
                  Export as CSV
                </button>
              </div>
            ) : (
              <EmptyState message="No analytics data for this assessment." />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
