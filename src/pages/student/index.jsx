import React, { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import Wishlist from "./Wishlist";
import Profile from "./Profile";
import CourseCatalog from "./CourseCatalog";

const CourseDetail = lazy(() => import("./CourseDetail"));
const LessonDetail = lazy(() => import("./LessonDetail"));
const AssignmentDetail = lazy(() => import("./AssignmentDetail"));
const Quizzes = lazy(() => import("./Quizzes"));
const QuizDetail = lazy(() => import("./QuizDetail"));

const StudentRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="courses/:id" element={<CourseDetail />} />
    <Route path="lessons/:id" element={<LessonDetail />} />
    <Route path="assignments/:lessonId" element={<AssignmentDetail />} />
    <Route path="quizzes" element={<Quizzes />} />
    <Route path="quizzes/:id" element={<QuizDetail />} />
    <Route path="wishlist" element={<Wishlist />} />
    <Route path="profile" element={<Profile />} />
    <Route path="courses" element={<CourseCatalog />} />
    {/* Add more student routes here */}
  </Routes>
);

export default StudentRoutes;
