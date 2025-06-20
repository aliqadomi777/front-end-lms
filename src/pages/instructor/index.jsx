import React, { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import AssignmentSubmissions from "./AssignmentSubmissions";

const Dashboard = lazy(() => import("./Dashboard"));
const CourseEditor = lazy(() => import("./CourseEditor"));
const Analytics = lazy(() => import("./Analytics"));

const InstructorRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="courses/new" element={<CourseEditor />} />
    <Route path="courses/:id" element={<CourseEditor />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="assignments" element={<AssignmentSubmissions />} />
    {/* Add more instructor routes here as needed */}
  </Routes>
);

export default InstructorRoutes;
