import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminDashboard,
  getEnrollmentTrends,
  getWeeklyEngagement,
  getTopStudents,
  getTopCourses,
  getSystemHealth,
  exportAnalytics,
} from "../../api/admin";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import {
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardListIcon,
  BeakerIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  UsersGroupIcon,
  StarIcon,
  DownloadIcon,
} from "@heroicons/react/outline";

const statIcons = {
  totalUsers: UsersIcon,
  totalInstructors: AcademicCapIcon,
  totalStudents: UsersIcon,
  totalCourses: BookOpenIcon,
  totalEnrollments: ClipboardListIcon,
  totalLessons: BookOpenIcon,
  totalAssignments: ClipboardListIcon,
  totalQuizzes: BeakerIcon,
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ label, value, icon: Icon }) => (
  <Panel className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
    <div className="bg-blue-100 p-3 rounded-full">
      <Icon className="w-8 h-8 text-blue-600" />
    </div>
  </Panel>
);

const Dashboard = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [exporting, setExporting] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard", dateFrom, dateTo],
    queryFn: () =>
      getAdminDashboard(token, { date_from: dateFrom, date_to: dateTo }),
    enabled: !!token,
    onError: (err) =>
      addToast("error", err.message || "Failed to load dashboard"),
  });

  const { data: enrollmentTrends } = useQuery({
    queryKey: ["enrollment-trends", dateFrom, dateTo],
    queryFn: async () => {
      const res = await getEnrollmentTrends(token, {
        date_from: dateFrom,
        date_to: dateTo,
      });
      return res.data.data;
    },
    enabled: !!token,
  });

  const { data: engagement } = useQuery({
    queryKey: ["weekly-engagement", dateFrom, dateTo],
    queryFn: async () => {
      const res = await getWeeklyEngagement(token, {
        date_from: dateFrom,
        date_to: dateTo,
      });
      return res.data.data;
    },
    enabled: !!token,
  });

  const { data: topStudents } = useQuery({
    queryKey: ["top-students", dateFrom, dateTo],
    queryFn: async () => {
      const res = await getTopStudents(token, {
        date_from: dateFrom,
        date_to: dateTo,
      });
      return res.data.data;
    },
    enabled: !!token,
  });

  const { data: topCourses } = useQuery({
    queryKey: ["top-courses", dateFrom, dateTo],
    queryFn: async () => {
      const res = await getTopCourses(token, {
        date_from: dateFrom,
        date_to: dateTo,
      });
      return res.data.data?.topCourses || [];
    },
    enabled: !!token,
  });

  const { data: systemHealth } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      const res = await getSystemHealth(token);
      return res.data.data;
    },
    enabled: !!token,
  });

  const handleExport = async (type, filename) => {
    setExporting(type);
    try {
      await exportAnalytics(token, type, filename);
      addToast("success", "Export started! Check your downloads.");
    } catch (err) {
      addToast("error", err.message || "Export failed.");
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton lines={12} className="p-4" />;
  }
  if (isError) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 mb-4">{error.message}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const mainStats = data?.data?.main_stats || {};

  return (
    <div className="space-y-8">
      {/* Filters */}
      <Panel className="p-4 flex flex-wrap gap-4 items-center">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <Button
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          variant="secondary"
        >
          Reset
        </Button>
        <Button
          onClick={() => handleExport("general", "general_analytics.csv")}
          disabled={exporting === "general"}
          variant="primary"
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          {exporting === "general" ? "Exporting..." : "Export General"}
        </Button>
      </Panel>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(mainStats).map(([key, value]) => (
          <StatCard
            key={key}
            label={key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            value={value}
            icon={statIcons[key] || StarIcon}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel className="p-4">
          <h3 className="font-semibold mb-4">Enrollment Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollmentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel className="p-4">
          <h3 className="font-semibold mb-4">Weekly Engagement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="logins" fill="#82ca9d" />
              <Bar dataKey="completions" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel className="p-4">
          <h3 className="font-semibold mb-4">Top Students</h3>
          {topStudents && topStudents.length > 0 ? (
            <ul className="space-y-2">
              {topStudents.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="font-bold">
                    {s.completed_lessons} lessons
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No student data available." />
          )}
        </Panel>
        <Panel className="p-4">
          <h3 className="font-semibold mb-4">Top Courses</h3>
          {topCourses && topCourses.length > 0 ? (
            <ul className="space-y-2">
              {topCourses.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.title}</span>
                  <span className="font-bold">
                    {c.enrollment_count} students
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No course data available." />
          )}
        </Panel>
      </div>

      {/* System Health */}
      {systemHealth && (
        <Panel className="p-4">
          <h3 className="font-semibold mb-4">System Health</h3>
          <div className="flex items-center gap-4">
            {systemHealth.db_status === "ok" ? (
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            ) : (
              <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
            )}
            <span>Database: {systemHealth.db_status}</span>
            <ClockIcon className="w-6 h-6 text-gray-500" />
            <span>API Response Time: {systemHealth.avg_response_time}ms</span>
          </div>
        </Panel>
      )}
    </div>
  );
};

export default Dashboard;
