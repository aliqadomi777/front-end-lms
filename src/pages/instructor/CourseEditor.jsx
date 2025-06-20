import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  getAllCategories,
} from "../../api/courses";
import {
  getModulesByCourse,
  createModule,
  updateModule,
  deleteModule,
  publishModule,
  unpublishModule,
  reorderModules,
} from "../../api/modules";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import {
  getLessonsByModule,
  createLesson,
  updateLesson,
  deleteLesson,
  publishLesson,
  unpublishLesson,
  reorderLessons,
} from "../../api/lessons";
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../../api/assignments";
import {
  getQuizzesByCourse,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "../../api/quizzes";
import ConfirmDialog from "../../components/ConfirmDialog";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactModal from "react-modal";
import QuizList from "./QuizList";
import RichTextEditor from "../../components/RichTextEditor";
import DOMPurify from "dompurify";
import axios from "axios";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import SecondaryButton from "../../components/SecondaryButton";
import DangerButton from "../../components/DangerButton";
import EmptyState from "../../components/EmptyState";

const courseSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
});

const moduleSchema = Yup.object().shape({
  title: Yup.string().required("Module title is required"),
});

const lessonSchema = Yup.object().shape({
  title: Yup.string().required("Lesson title is required"),
});

const assignmentSchema = Yup.object().shape({
  title: Yup.string().required("Assignment title is required"),
  description: Yup.string().required("Description is required"),
});

const quizSchema = Yup.object().shape({
  title: Yup.string().required("Quiz title is required"),
  description: Yup.string().required("Description is required"),
});

const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : "auto",
        background: isDragging ? "#f3f4f6" : undefined,
      }}
      {...attributes}
      {...listeners}
      tabIndex={0}
      className="focus:outline-none"
    >
      {children}
    </li>
  );
};

const QuestionEditorModal = ({ open, onClose, question, onSave }) => {
  const [form, setForm] = useState({
    question_text: question?.question_text || "",
    question_type: question?.question_type || "multiple_choice",
    points: question?.points || 1,
    is_required: question?.is_required ?? true,
    options: question?.options || [
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
    ],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      question_text: question?.question_text || "",
      question_type: question?.question_type || "multiple_choice",
      points: question?.points || 1,
      is_required: question?.is_required ?? true,
      options: question?.options || [
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ],
    });
    setErrors({});
  }, [question, open]);

  const validate = () => {
    const errs = {};
    if (!form.question_text.trim())
      errs.question_text = "Question text is required.";
    if (
      ["multiple_choice", "multiple_select", "true_false"].includes(
        form.question_type
      )
    ) {
      if (!form.options || form.options.length < 2)
        errs.options = "At least 2 options are required.";
      if (form.options.some((opt) => !opt.option_text.trim()))
        errs.options = "All options must have text.";
      const correctCount = form.options.filter((opt) => opt.is_correct).length;
      if (form.question_type === "multiple_choice" && correctCount !== 1)
        errs.options = "Multiple choice must have exactly 1 correct option.";
      if (form.question_type === "multiple_select" && correctCount < 1)
        errs.options = "Multiple select must have at least 1 correct option.";
      if (form.question_type === "true_false") {
        if (form.options.length !== 2)
          errs.options = "True/False must have exactly 2 options.";
        if (correctCount !== 1)
          errs.options = "True/False must have exactly 1 correct option.";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOptionChange = (idx, field, value) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[idx][field] = value;
      return { ...prev, options };
    });
  };
  const handleAddOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { option_text: "", is_correct: false }],
    }));
  };
  const handleRemoveOption = (idx) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  };

  // Only show options for allowed types
  const showOptions = [
    "multiple_choice",
    "multiple_select",
    "true_false",
  ].includes(form.question_type);

  return (
    <ReactModal
      isOpen={open}
      onRequestClose={onClose}
      contentLabel="Question Editor"
      ariaHideApp={false}
      className="modal"
      overlayClassName="modal-overlay"
      aria-labelledby="question-modal-title"
      shouldFocusAfterRender={true}
    >
      <h3 id="question-modal-title">
        {question ? "Edit Question" : "Add Question"}
      </h3>
      <label htmlFor="question-text" className="block font-medium mb-1">
        Question Text
      </label>
      <RichTextEditor
        value={form.question_text}
        onChange={(val) => setForm((prev) => ({ ...prev, question_text: val }))}
        placeholder="Question text (Markdown or rich text supported)"
        className="w-full mb-2"
        ariaLabel="Question Text"
        tabIndex={0}
      />
      {errors.question_text && (
        <div className="text-red-500 text-sm mb-1">{errors.question_text}</div>
      )}
      <label htmlFor="question-type" className="block font-medium mb-1">
        Type
      </label>
      <select
        id="question-type"
        name="question_type"
        value={form.question_type}
        onChange={handleChange}
        className="w-full mb-2 px-3 py-2 border rounded"
        aria-label="Question Type"
      >
        <option value="multiple_choice">Multiple Choice</option>
        <option value="multiple_select">Multiple Select</option>
        <option value="true_false">True/False</option>
      </select>
      <label htmlFor="question-points" className="block font-medium mb-1">
        Points
      </label>
      <input
        type="number"
        id="question-points"
        name="points"
        value={form.points}
        onChange={handleChange}
        min={1}
        className="w-full mb-2 px-3 py-2 border rounded"
        placeholder="Points"
        aria-label="Points"
      />
      <label className="flex items-center mb-2">
        <input
          type="checkbox"
          name="is_required"
          checked={form.is_required}
          onChange={handleChange}
          className="mr-2"
          aria-label="Required"
        />
        Required
      </label>
      {showOptions && (
        <div className="mb-2">
          <div className="font-semibold mb-1">Options</div>
          {form.options.map((opt, idx) => (
            <div key={idx} className="flex gap-2 mb-1 items-center">
              {/* Optionally, use RichTextEditor for option text if rich options are needed in the future */}
              <input
                type="text"
                value={opt.option_text}
                onChange={(e) =>
                  handleOptionChange(idx, "option_text", e.target.value)
                }
                placeholder={`Option ${idx + 1}`}
                className="flex-1 px-2 py-1 border rounded"
                aria-label={`Option ${idx + 1}`}
              />
              <input
                type={
                  form.question_type === "multiple_select"
                    ? "checkbox"
                    : "radio"
                }
                name="is_correct"
                checked={!!opt.is_correct}
                onChange={(e) =>
                  handleOptionChange(
                    idx,
                    "is_correct",
                    form.question_type === "multiple_select"
                      ? e.target.checked
                      : true
                  )
                }
                className="mr-1"
                aria-label="Correct Option"
                tabIndex={0}
              />
              <span>Correct</span>
              {form.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="text-red-500 ml-2"
                  aria-label="Remove Option"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddOption}
            className="mt-1 px-2 py-1 bg-gray-200 rounded"
            aria-label="Add Option"
          >
            + Add Option
          </button>
          {errors.options && (
            <div className="text-red-500 text-sm mt-1">{errors.options}</div>
          )}
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleSave}
          aria-label="Save Question"
        >
          Save
        </button>
        <button
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
          onClick={onClose}
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>
    </ReactModal>
  );
};

const CourseEditor = () => {
  const { id } = useParams();
  const isNew = id === "new";
  const { token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingModule, setEditingModule] = useState(null); // null or module object
  const [editingLesson, setEditingLesson] = useState({}); // { [moduleId]: lessonObj|null }
  const [editingAssignment, setEditingAssignment] = useState(null); // assignment object or null
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    onConfirm: null,
    message: "",
  });
  const [publishing, setPublishing] = useState({}); // { type, id, loading }
  const [moduleOrder, setModuleOrder] = useState([]); // array of module ids
  const [lessonOrder, setLessonOrder] = useState({}); // { [moduleId]: [lessonIds] }
  const [reordering, setReordering] = useState({ type: null, id: null });
  const [lessonModal, setLessonModal] = useState({
    open: false,
    moduleId: null,
    lesson: null,
  });
  const [lessonForm, setLessonForm] = useState({
    title: "",
    content_type: "text",
    content: "",
    assignment: {
      description: "",
      instructions: "",
      deadline: "",
      max_score: 100,
      allow_late_submission: false,
    },
  });
  const [lessonSaving, setLessonSaving] = useState(false);
  const [quizEditorOpen, setQuizEditorOpen] = useState(false);
  const [questionModal, setQuestionModal] = useState({
    open: false,
    question: null,
  });
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  const [previewQuiz, setPreviewQuiz] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [categories, setCategories] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailFileId, setThumbnailFileId] = useState(null);

  // Fetch course details if editing
  const {
    data: courseData,
    isLoading: courseLoading,
    isError: courseError,
    error: courseErrObj,
  } = useQuery({
    queryKey: ["course", id],
    queryFn: () => getCourseById(id),
    enabled: !!id && !isNew,
    onError: (err) => addToast("error", err.message || "Failed to load course"),
  });

  // Fetch modules for the course
  const {
    data: modulesData,
    isLoading: modulesLoading,
    isError: modulesError,
    error: modulesErrObj,
    refetch: refetchModules,
  } = useQuery({
    queryKey: ["modules", id],
    queryFn: () => getModulesByCourse(token, id),
    enabled: !!token && !!id && !isNew,
    onError: (err) =>
      addToast("error", err.message || "Failed to load modules"),
  });

  // Course form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    getValues,
    setValue,
  } = useForm({
    resolver: yupResolver(courseSchema),
    defaultValues: { title: "", description: "" },
  });

  // Module form
  const {
    register: registerModule,
    handleSubmit: handleSubmitModule,
    reset: resetModule,
    setValue: setModuleValue,
    formState: { errors: moduleErrors },
  } = useForm({
    resolver: yupResolver(moduleSchema),
    defaultValues: { title: "" },
  });

  // Lesson form state per module
  const lessonForms = {};
  modulesData?.modules?.forEach((mod) => {
    lessonForms[mod.id] = useForm({
      resolver: yupResolver(lessonSchema),
      defaultValues: { title: "" },
    });
  });

  // Assignment form
  const {
    register: registerAssignment,
    handleSubmit: handleSubmitAssignment,
    reset: resetAssignment,
    setValue: setAssignmentValue,
    formState: { errors: assignmentErrors },
  } = useForm({
    resolver: yupResolver(assignmentSchema),
    defaultValues: { title: "", description: "" },
  });

  // Quiz form
  const {
    register: registerQuiz,
    handleSubmit: handleSubmitQuiz,
    reset: resetQuiz,
    setValue: setQuizValue,
    formState: { errors: quizErrors },
  } = useForm({
    resolver: yupResolver(quizSchema),
    defaultValues: { title: "", description: "" },
  });

  useEffect(() => {
    if (courseData?.course && !isNew) {
      reset({
        title: courseData.course.title,
        description: courseData.course.description,
      });
    }
  }, [courseData, isNew, reset]);

  // Create/update/delete mutations
  const createMutation = useMutation({
    mutationFn: (data) => createCourse(token, data),
    onSuccess: () => {
      addToast("success", "Course created!");
      queryClient.invalidateQueries(["instructor-courses"]);
      navigate("/instructor/dashboard");
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to create course"),
  });
  const updateMutation = useMutation({
    mutationFn: (data) => updateCourse(token, id, data),
    onSuccess: () => {
      addToast("success", "Course updated!");
      queryClient.invalidateQueries(["instructor-courses"]);
      navigate("/instructor/dashboard");
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to update course"),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteCourse(token, id),
    onSuccess: () => {
      addToast("success", "Course deleted!");
      queryClient.invalidateQueries(["instructor-courses"]);
      navigate("/instructor/dashboard");
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to delete course"),
  });

  // Module mutations
  const createModuleMutation = useMutation({
    mutationFn: (data) => createModule(token, id, data),
    onSuccess: () => {
      addToast("success", "Module created!");
      queryClient.invalidateQueries(["modules", id]);
      resetModule();
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to create module"),
  });
  const updateModuleMutation = useMutation({
    mutationFn: (data) => updateModule(token, editingModule.id, data),
    onSuccess: () => {
      addToast("success", "Module updated!");
      queryClient.invalidateQueries(["modules", id]);
      setEditingModule(null);
      resetModule();
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to update module"),
  });
  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId) => deleteModule(token, moduleId),
    onSuccess: () => {
      addToast("success", "Module deleted!");
      queryClient.invalidateQueries(["modules", id]);
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to delete module"),
  });

  // Assignment queries and mutations
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
    error: assignmentsErrObj,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["assignments", id],
    queryFn: () => getAssignments(token),
    enabled: !!token && !isNew,
    onError: (err) =>
      addToast("error", err.message || "Failed to load assignments"),
  });
  const createAssignmentMutation = useMutation({
    mutationFn: (data) => createAssignment(token, data),
    onSuccess: () => {
      addToast("success", "Assignment created!");
      queryClient.invalidateQueries(["assignments", id]);
      resetAssignment();
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to create assignment"),
  });
  const updateAssignmentMutation = useMutation({
    mutationFn: (data) => updateAssignment(token, editingAssignment.id, data),
    onSuccess: () => {
      addToast("success", "Assignment updated!");
      queryClient.invalidateQueries(["assignments", id]);
      setEditingAssignment(null);
      resetAssignment();
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to update assignment"),
  });
  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId) => deleteAssignment(token, assignmentId),
    onSuccess: () => {
      addToast("success", "Assignment deleted!");
      queryClient.invalidateQueries(["assignments", id]);
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to delete assignment"),
  });

  // Quiz queries and mutations
  const {
    data: quizzesData,
    isLoading: quizzesLoading,
    isError: quizzesError,
    error: quizzesErrObj,
    refetch: refetchQuizzes,
  } = useQuery({
    queryKey: ["quizzes", id],
    queryFn: () => getQuizzesByCourse(id),
    enabled: !!id && !isNew,
    onError: (err) =>
      addToast("error", err.message || "Failed to load quizzes"),
  });
  const createQuizMutation = useMutation({
    mutationFn: (data) => createQuiz(token, data),
    onSuccess: () => {
      addToast("success", "Quiz created!");
      queryClient.invalidateQueries(["quizzes", id]);
      resetQuiz();
    },
    onError: (err) => addToast("error", err.message || "Failed to create quiz"),
  });
  const updateQuizMutation = useMutation({
    mutationFn: (data) => updateQuiz(token, editingQuiz.id, data),
    onError: (err) => addToast("error", err.message || "Failed to update quiz"),
  });
  const deleteQuizMutation = useMutation({
    mutationFn: (quizId) => deleteQuiz(token, quizId),
    onSuccess: () => {
      addToast("success", "Quiz deleted!");
      queryClient.invalidateQueries(["quizzes", id]);
    },
    onError: (err) => addToast("error", err.message || "Failed to delete quiz"),
  });

  // Helper to open confirm dialog
  const openConfirm = (message, onConfirm) => {
    setConfirmDialog({ open: true, message, onConfirm });
  };
  const closeConfirm = () =>
    setConfirmDialog({ open: false, onConfirm: null, message: "" });

  // Publish/unpublish handlers
  const handleCoursePublishToggle = async (isPublished) => {
    setPublishing({ type: "course", id, loading: true });
    try {
      if (isPublished) {
        await unpublishCourse(token, id);
        addToast("success", "Course unpublished");
      } else {
        await publishCourse(token, id);
        addToast("success", "Course published");
      }
      queryClient.invalidateQueries(["course", id]);
      queryClient.invalidateQueries(["instructor-courses"]);
    } catch (err) {
      addToast("error", err.message);
    } finally {
      setPublishing({});
    }
  };
  const handleModulePublishToggle = async (mod) => {
    setPublishing({ type: "module", id: mod.id, loading: true });
    try {
      if (mod.is_published) {
        await unpublishModule(token, mod.id);
        addToast("success", "Module unpublished");
      } else {
        await publishModule(token, mod.id);
        addToast("success", "Module published");
      }
      queryClient.invalidateQueries(["modules", id]);
    } catch (err) {
      addToast("error", err.message);
    } finally {
      setPublishing({});
    }
  };
  const handleLessonPublishToggle = async (lesson, modId) => {
    setPublishing({ type: "lesson", id: lesson.id, loading: true });
    try {
      if (lesson.is_published) {
        await unpublishLesson(token, lesson.id);
        addToast("success", "Lesson unpublished");
      } else {
        await publishLesson(token, lesson.id);
        addToast("success", "Lesson published");
      }
      queryClient.invalidateQueries(["lessons", modId]);
    } catch (err) {
      addToast("error", err.message);
    } finally {
      setPublishing({});
    }
  };

  // Update moduleOrder when modulesData changes
  useEffect(() => {
    if (modulesData?.modules) {
      setModuleOrder(modulesData.modules.map((m) => m.id));
    }
  }, [modulesData]);
  // Update lessonOrder when lessonsData changes
  useEffect(() => {
    if (modulesData?.modules) {
      const newLessonOrder = {};
      modulesData.modules.forEach((mod) => {
        if (mod.lessons) {
          newLessonOrder[mod.id] = mod.lessons.map((l) => l.id);
        }
      });
      setLessonOrder((prev) => ({ ...prev, ...newLessonOrder }));
    }
  }, [modulesData]);

  // Handle module drag end
  const handleModuleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = moduleOrder.indexOf(active.id);
      const newIndex = moduleOrder.indexOf(over.id);
      const newOrder = arrayMove(moduleOrder, oldIndex, newIndex);
      setModuleOrder(newOrder);
      setReordering({ type: "module", id: active.id });
      try {
        await reorderModules(
          token,
          id,
          newOrder.map((mid, idx) => ({ id: mid, position: idx + 1 }))
        );
        queryClient.invalidateQueries(["modules", id]);
        addToast("success", "Modules reordered");
      } catch (err) {
        addToast("error", err.message);
      } finally {
        setReordering({ type: null, id: null });
      }
    }
  };
  // Handle lesson drag end
  const handleLessonDragEnd = async (modId, event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = lessonOrder[modId].indexOf(active.id);
      const newIndex = lessonOrder[modId].indexOf(over.id);
      const newOrder = arrayMove(lessonOrder[modId], oldIndex, newIndex);
      setLessonOrder((prev) => ({ ...prev, [modId]: newOrder }));
      setReordering({ type: "lesson", id: active.id });
      try {
        await reorderLessons(
          token,
          modId,
          newOrder.map((lid, idx) => ({ id: lid, position: idx + 1 }))
        );
        queryClient.invalidateQueries(["lessons", modId]);
        addToast("success", "Lessons reordered");
      } catch (err) {
        addToast("error", err.message);
      } finally {
        setReordering({ type: null, id: null });
      }
    }
  };

  const openLessonModal = (moduleId, lesson = null) => {
    setLessonModal({ open: true, moduleId, lesson });
    if (lesson) {
      setLessonForm({
        title: lesson.title || "",
        content_type: lesson.content_type || "text",
        content: lesson.content || "",
        assignment: lesson.assignment || {
          description: "",
          instructions: "",
          deadline: "",
          max_score: 100,
          allow_late_submission: false,
        },
      });
    } else {
      setLessonForm({
        title: "",
        content_type: "text",
        content: "",
        assignment: {
          description: "",
          instructions: "",
          deadline: "",
          max_score: 100,
          allow_late_submission: false,
        },
      });
    }
  };
  const closeLessonModal = () =>
    setLessonModal({ open: false, moduleId: null, lesson: null });

  const handleLessonFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("assignment.")) {
      const key = name.split(".")[1];
      setLessonForm((prev) => ({
        ...prev,
        assignment: {
          ...prev.assignment,
          [key]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setLessonForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLessonSave = async () => {
    setLessonSaving(true);
    const { title, content_type, content, assignment } = lessonForm;
    let lessonData = { title, content_type, content };
    try {
      let lessonRes;
      if (lessonModal.lesson) {
        // Update lesson
        lessonRes = await updateLesson(
          token,
          lessonModal.lesson.id,
          lessonData
        );
      } else {
        // Create lesson
        lessonRes = await createLesson(token, lessonModal.moduleId, lessonData);
      }
      // If assignment, create or update assignment
      if (content_type === "assignment") {
        const assignmentData = {
          ...assignment,
          lesson_id: lessonRes.lesson.id,
        };
        if (lessonModal.lesson && lessonModal.lesson.assignment_id) {
          await updateAssignment(
            token,
            lessonModal.lesson.assignment_id,
            assignmentData
          );
        } else {
          await createAssignment(token, assignmentData);
        }
      }
      addToast(
        "success",
        `Lesson ${lessonModal.lesson ? "updated" : "created"} successfully`
      );
      // Refetch lessons for the module
      await queryClient.invalidateQueries(["lessons", lessonModal.moduleId]);
      closeLessonModal();
    } catch (err) {
      addToast("error", err.message || "Failed to save lesson");
    } finally {
      setLessonSaving(false);
    }
  };

  const handleOpenQuizEditor = (quiz = null) => {
    setEditingQuiz(quiz);
    setQuizEditorOpen(true);
  };
  const handleCloseQuizEditor = () => {
    setQuizEditorOpen(false);
    setEditingQuiz(null);
  };
  const handleSaveQuiz = async (quizData, questions) => {
    const quizError = validateQuiz();
    if (quizError) {
      setQuestionsError(quizError);
      return;
    }
    try {
      if (editingQuiz && editingQuiz.id) {
        // Update
        const res = await updateQuiz(token, editingQuiz.id, quizData);
        setQuestions(questions);
      } else {
        // Create
        const res = await createQuiz(token, quizData);
        setQuestions(questions);
      }
      handleCloseQuizEditor();
    } catch (err) {
      setQuestionsError(err.message);
    }
  };

  const openQuestionModal = (question = null) =>
    setQuestionModal({ open: true, question });
  const closeQuestionModal = () =>
    setQuestionModal({ open: false, question: null });
  const handleSaveQuestion = async (q) => {
    try {
      if (questionModal.question && questionModal.question.id) {
        // Update
        const res = await updateQuestion(token, questionModal.question.id, q);
        setQuestions((prev) =>
          prev.map((qq) => (qq.id === res.question.id ? res.question : qq))
        );
      } else {
        // Create
        const res = await createQuestion(token, editingQuiz.id, q);
        setQuestions((prev) => [...prev, res.question]);
      }
      closeQuestionModal();
    } catch (err) {
      setQuestionsError(err.message);
    }
  };
  const handleDeleteQuestion = async (q) => {
    if (!q.id) {
      setQuestions((prev) => prev.filter((qq) => qq !== q));
      return;
    }
    try {
      await deleteQuestion(token, q.id);
      setQuestions((prev) => prev.filter((qq) => qq.id !== q.id));
    } catch (err) {
      setQuestionsError(err.message);
    }
  };

  // Fetch questions when editing an existing quiz
  useEffect(() => {
    if (editingQuiz && editingQuiz.id) {
      setLoadingQuestions(true);
      getQuestionsByQuiz(editingQuiz.id)
        .then((res) => setQuestions(res.questions))
        .catch((err) => setQuestionsError(err.message))
        .finally(() => setLoadingQuestions(false));
    } else {
      setQuestions([]);
    }
  }, [editingQuiz]);

  const handlePreviewQuiz = async (quiz) => {
    setPreviewQuiz(quiz);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await getQuestionsByQuiz(quiz.id);
      setPreviewQuestions(res.questions);
    } catch (err) {
      setPreviewError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };
  const handleClosePreview = () => {
    setPreviewQuiz(null);
    setPreviewQuestions([]);
    setPreviewError(null);
  };

  useEffect(() => {
    // Fetch categories on mount
    (async () => {
      try {
        const cats = await getAllCategories(token);
        setCategories(cats);
      } catch (err) {
        addToast("error", "Failed to load categories");
      }
    })();
  }, [token]);

  // Handle thumbnail file change
  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    // Upload to backend
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_type", "course_thumbnail");
    try {
      const res = await axios.post("/api/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setThumbnailFileId(res.data.data.id);
      addToast("success", "Thumbnail uploaded");
    } catch (err) {
      addToast(
        "error",
        err.response?.data?.message || "Failed to upload thumbnail"
      );
      setThumbnailFile(null);
      setThumbnailPreview("");
      setThumbnailFileId(null);
    }
  };

  if (courseLoading && !isNew) {
    return <LoadingSkeleton lines={8} className="mt-10 max-w-2xl mx-auto" />;
  }
  if (courseError) {
    return (
      <div className="text-center mt-10 text-red-500">
        {courseErrObj.message}
      </div>
    );
  }

  const onSubmit = (data) => {
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  // Module form submit
  const onSubmitModule = (data) => {
    if (editingModule) {
      updateModuleMutation.mutate(data);
    } else {
      createModuleMutation.mutate(data);
    }
  };

  // Edit module handler
  const handleEditModule = (module) => {
    setEditingModule(module);
    setModuleValue("title", module.title);
  };

  // Cancel module edit
  const handleCancelModuleEdit = () => {
    setEditingModule(null);
    resetModule();
  };

  // Edit module handler
  const handleEditLesson = (lesson) => {
    setEditingLesson({ [lesson.module_id]: lesson });
    setAssignmentValue("title", lesson.title);
    setAssignmentValue("description", lesson.description);
  };

  // Cancel lesson edit
  const handleCancelLessonEdit = (modId) => {
    setEditingLesson({ [modId]: null });
    resetAssignment();
  };

  // Quiz form submit
  const onSubmitQuiz = (data) => {
    if (editingQuiz) {
      updateQuizMutation.mutate(data);
    } else {
      createQuizMutation.mutate(data);
    }
  };

  // Edit quiz handler
  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizValue("title", quiz.title);
    setQuizValue("description", quiz.description);
  };

  // Cancel quiz edit
  const handleCancelQuizEdit = () => {
    setEditingQuiz(null);
    resetQuiz();
  };

  const handleQuestionDragEnd = async ({ active, over }) => {
    if (active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const newOrder = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newOrder);
      // Persist order to backend if all questions have IDs
      if (newOrder.every((q) => q.id)) {
        setReordering(true);
        try {
          await reorderQuestions(
            token,
            editingQuiz.id,
            newOrder.map((q, idx) => ({ id: q.id, position: idx + 1 }))
          );
        } catch (err) {
          setQuestionsError(err.message);
        } finally {
          setReordering(false);
        }
      }
    }
  };

  const validateQuiz = () => {
    if (!form.title.trim()) return "Quiz title is required.";
    if (questions.length === 0) return "At least one question is required.";
    for (const q of questions) {
      if (!q.question_text || !q.options || q.options.length < 2)
        return "All questions must be valid.";
      if (
        ["multiple_choice", "multiple_select", "true_false"].includes(
          q.question_type
        )
      ) {
        if (q.options.some((opt) => !opt.option_text.trim()))
          return "All options must have text.";
        const correctCount = q.options.filter((opt) => opt.is_correct).length;
        if (q.question_type === "multiple_choice" && correctCount !== 1)
          return "Each multiple choice must have exactly 1 correct option.";
        if (q.question_type === "multiple_select" && correctCount < 1)
          return "Each multiple select must have at least 1 correct option.";
        if (q.question_type === "true_false") {
          if (q.options.length !== 2)
            return "True/False must have exactly 2 options.";
          if (correctCount !== 1)
            return "True/False must have exactly 1 correct option.";
        }
      }
    }
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {showBanner && (
        <Panel className="bg-blue-50 border border-blue-200 mb-8 flex items-center justify-between transition-all">
          <span className="text-blue-800 font-medium">
            Here you can create or edit your course, manage modules, lessons,
            assignments, and quizzes. Need help? See the documentation.
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
      <Panel className="mb-8 transition p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-4">
          {isNew ? "Create Course" : "Edit Course"}
          {!isNew && courseData?.course && (
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ml-2 ${
                courseData.course.is_published
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {courseData.course.is_published ? "Published" : "Draft"}
            </span>
          )}
        </h1>
        {!isNew && courseData?.course && (
          <PrimaryButton
            type="button"
            className={`mb-4 px-4 py-2 font-semibold ${
              courseData.course.is_published
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            } ${
              publishing.type === "course" && publishing.loading
                ? "opacity-60"
                : ""
            }`}
            onClick={() =>
              handleCoursePublishToggle(courseData.course.is_published)
            }
            disabled={publishing.type === "course" && publishing.loading}
          >
            {publishing.type === "course" && publishing.loading
              ? courseData.course.is_published
                ? "Unpublishing..."
                : "Publishing..."
              : courseData.course.is_published
              ? "Unpublish"
              : "Publish"}
          </PrimaryButton>
        )}
        <form
          onSubmit={handleSubmit((data) => {
            // Add thumbnail_file_id and category_id to data
            const submitData = {
              ...data,
              thumbnail_file_id:
                thumbnailFileId ||
                (courseData?.course?.thumbnail_file_id ?? null),
              category_id:
                data.category_id || (courseData?.course?.category_id ?? null),
            };
            onSubmit(submitData);
          })}
          className="space-y-6"
        >
          <div>
            <label className="block mb-1 font-medium">Title</label>
            <input
              type="text"
              {...register("title")}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring transition ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              disabled={createMutation.isLoading || updateMutation.isLoading}
              aria-label="Course Title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">Description</label>
            <RichTextEditor
              value={getValues("description")}
              onChange={(val) =>
                setValue("description", val, { shouldValidate: true })
              }
              className={`w-full mb-2 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              ariaLabel="Course Description"
              tabIndex={0}
              placeholder="Course Description (Markdown or rich text supported)"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">Category</label>
            <select
              {...register("category_id", { required: true })}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring transition ${
                errors.category_id ? "border-red-500" : "border-gray-300"
              }`}
              disabled={createMutation.isLoading || updateMutation.isLoading}
              aria-label="Course Category"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-red-500 text-sm mt-1">Category is required</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="w-full mb-2"
              aria-label="Course Thumbnail"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            />
            {thumbnailPreview && (
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="h-24 mt-2 rounded shadow"
              />
            )}
            {!thumbnailPreview && courseData?.course?.thumbnail_url && (
              <img
                src={courseData.course.thumbnail_url}
                alt="Current thumbnail"
                className="h-24 mt-2 rounded shadow"
              />
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <PrimaryButton
              type="submit"
              className="px-4 py-2"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {isNew
                ? createMutation.isLoading
                  ? "Creating..."
                  : "Create"
                : updateMutation.isLoading
                ? "Saving..."
                : "Save"}
            </PrimaryButton>
            {!isNew && (
              <DangerButton
                type="button"
                onClick={() =>
                  openConfirm(
                    "Are you sure you want to delete this course? This action cannot be undone.",
                    () => deleteMutation.mutate()
                  )
                }
                className="px-4 py-2"
                disabled={deleteMutation.isLoading}
                aria-label="Delete course"
              >
                {deleteMutation.isLoading ? "Deleting..." : "Delete"}
              </DangerButton>
            )}
            <SecondaryButton
              type="button"
              onClick={() => navigate("/instructor/dashboard")}
              className="px-4 py-2"
              aria-label="Cancel"
            >
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Panel>
      {/* Module management */}
      {!isNew && (
        <Panel className="bg-white rounded shadow p-6 mb-8 transition">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Modules</h2>
          {/* Module form */}
          <form
            onSubmit={handleSubmitModule(onSubmitModule)}
            className="flex gap-2 mb-6 flex-wrap"
          >
            <input
              type="text"
              {...registerModule("title")}
              placeholder="Module title"
              className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring transition ${
                moduleErrors.title ? "border-red-500" : "border-gray-300"
              }`}
              disabled={
                createModuleMutation.isLoading || updateModuleMutation.isLoading
              }
              aria-label="Module Title"
            />
            <PrimaryButton
              type="submit"
              className="px-4 py-2"
              disabled={
                createModuleMutation.isLoading || updateModuleMutation.isLoading
              }
            >
              {editingModule
                ? updateModuleMutation.isLoading
                  ? "Saving..."
                  : "Save"
                : createModuleMutation.isLoading
                ? "Adding..."
                : "Add Module"}
            </PrimaryButton>
            {editingModule && (
              <SecondaryButton
                type="button"
                onClick={handleCancelModuleEdit}
                className="px-4 py-2"
                aria-label="Cancel module edit"
              >
                Cancel
              </SecondaryButton>
            )}
          </form>
          {/* Module list (drag-and-drop) */}
          {modulesLoading ? (
            <LoadingSkeleton lines={4} />
          ) : modulesError ? (
            <div className="text-red-500">{modulesErrObj.message}</div>
          ) : modulesData?.modules?.length === 0 ? (
            <EmptyState message="No modules yet." />
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleModuleDragEnd}
            >
              <SortableContext
                items={moduleOrder}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-4">
                  {moduleOrder.map((modId) => {
                    const mod = modulesData.modules.find((m) => m.id === modId);
                    if (!mod) return null;
                    return (
                      <SortableItem key={mod.id} id={mod.id}>
                        <Panel className="bg-blue-50 rounded shadow p-4 flex flex-col gap-2 transition hover:shadow-lg focus-within:shadow-lg">
                          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                            <span className="font-semibold text-lg flex items-center gap-2 text-blue-800">
                              {mod.title}
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                  mod.is_published
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {mod.is_published ? "Published" : "Draft"}
                              </span>
                            </span>
                            <div className="flex gap-2">
                              <PrimaryButton
                                onClick={() => handleEditModule(mod)}
                                className="px-3 py-1 text-sm"
                                aria-label={`Edit module ${mod.title}`}
                              >
                                Edit
                              </PrimaryButton>
                              <DangerButton
                                onClick={() =>
                                  openConfirm(
                                    `Are you sure you want to delete module '${mod.title}'?`,
                                    () => deleteModuleMutation.mutate(mod.id)
                                  )
                                }
                                className="px-3 py-1 text-sm"
                                aria-label={`Delete module ${mod.title}`}
                              >
                                Delete
                              </DangerButton>
                              <PrimaryButton
                                onClick={() => handleModulePublishToggle(mod)}
                                className={`px-3 py-1 text-sm ${
                                  mod.is_published
                                    ? "bg-yellow-600 hover:bg-yellow-700"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                                aria-label={
                                  mod.is_published
                                    ? `Unpublish module ${mod.title}`
                                    : `Publish module ${mod.title}`
                                }
                              >
                                {mod.is_published ? "Unpublish" : "Publish"}
                              </PrimaryButton>
                            </div>
                          </div>
                          {/* Lessons for this module */}
                          <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleLessonDragEnd(mod.id, e)}
                          >
                            <SortableContext
                              items={lessonOrder[mod.id] || []}
                              strategy={verticalListSortingStrategy}
                            >
                              <ul className="space-y-2">
                                <li>
                                  <PrimaryButton
                                    className="mb-2 px-3 py-1 text-sm"
                                    onClick={() => openLessonModal(mod.id)}
                                    type="button"
                                    aria-label={`Add lesson to module ${mod.title}`}
                                  >
                                    + Add Lesson
                                  </PrimaryButton>
                                </li>
                                {(lessonOrder[mod.id] || []).map((lessonId) => {
                                  const lesson = (mod.lessons || []).find(
                                    (l) => l.id === lessonId
                                  );
                                  if (!lesson) return null;
                                  return (
                                    <SortableItem
                                      key={lesson.id}
                                      id={lesson.id}
                                    >
                                      <Panel className="bg-white rounded shadow p-4 flex justify-between items-center transition hover:shadow-lg focus-within:shadow-lg">
                                        <span className="flex items-center gap-2 text-blue-800 font-medium">
                                          {lesson.title}
                                          <span
                                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                              lesson.is_published
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                                          >
                                            {lesson.is_published
                                              ? "Published"
                                              : "Draft"}
                                          </span>
                                        </span>
                                        <div className="flex gap-2">
                                          <PrimaryButton
                                            type="button"
                                            className={`px-3 py-1 text-sm font-semibold ${
                                              lesson.is_published
                                                ? "bg-yellow-600 hover:bg-yellow-700"
                                                : "bg-green-600 hover:bg-green-700"
                                            }`}
                                            onClick={() =>
                                              handleLessonPublishToggle(
                                                lesson,
                                                mod.id
                                              )
                                            }
                                            aria-label={
                                              lesson.is_published
                                                ? `Unpublish lesson ${lesson.title}`
                                                : `Publish lesson ${lesson.title}`
                                            }
                                          >
                                            {lesson.is_published
                                              ? "Unpublish"
                                              : "Publish"}
                                          </PrimaryButton>
                                          <PrimaryButton
                                            onClick={() =>
                                              openLessonModal(mod.id, lesson)
                                            }
                                            className="px-3 py-1 text-sm"
                                            aria-label={`Edit lesson ${lesson.title}`}
                                          >
                                            Edit
                                          </PrimaryButton>
                                          <DangerButton
                                            onClick={() =>
                                              openConfirm(
                                                `Are you sure you want to delete lesson '${lesson.title}'?`,
                                                () =>
                                                  deleteLesson(
                                                    lesson.id,
                                                    mod.id
                                                  )
                                              )
                                            }
                                            className="px-3 py-1 text-sm"
                                            aria-label={`Delete lesson ${lesson.title}`}
                                          >
                                            Delete
                                          </DangerButton>
                                        </div>
                                      </Panel>
                                    </SortableItem>
                                  );
                                })}
                              </ul>
                            </SortableContext>
                          </DndContext>
                        </Panel>
                      </SortableItem>
                    );
                  })}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </Panel>
      )}
      {/* Quiz management */}
      {!isNew && (
        <>
          <Panel className="bg-white rounded shadow p-6 mb-8 transition">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">
              Quizzes
            </h2>
            <PrimaryButton
              className="mb-4 px-4 py-2"
              onClick={() => handleOpenQuizEditor()}
              type="button"
              aria-label="Add quiz"
            >
              + Add Quiz
            </PrimaryButton>
            {quizzesLoading ? (
              <LoadingSkeleton lines={3} />
            ) : quizzesError ? (
              <div className="text-red-500">{quizzesErrObj.message}</div>
            ) : quizzesData?.quizzes?.length === 0 ? (
              <EmptyState message="No quizzes yet." />
            ) : (
              <QuizList
                quizzes={quizzesData.quizzes}
                onEdit={handleEditQuiz}
                onDelete={handleDeleteQuiz}
                onPreview={handlePreviewQuiz}
              />
            )}
          </Panel>
          <QuizEditorModal
            open={quizEditorOpen}
            onClose={handleCloseQuizEditor}
            quiz={editingQuiz}
            onSave={handleSaveQuiz}
            className="bg-white rounded shadow p-6 transition"
          />
        </>
      )}
      {/* Confirm Dialog for destructive actions */}
      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
          closeConfirm();
        }}
        onCancel={closeConfirm}
      />
      <ReactModal
        isOpen={lessonModal.open}
        onRequestClose={closeLessonModal}
        contentLabel="Lesson Editor"
        ariaHideApp={false}
        className="modal"
        overlayClassName="modal-overlay"
        shouldFocusAfterRender={true}
      >
        <h2 id="lesson-modal-title">
          {lessonModal.lesson ? "Edit Lesson" : "Add Lesson"}
        </h2>
        <label htmlFor="lesson-title" className="block font-medium mb-1">
          Title
        </label>
        <input
          id="lesson-title"
          name="title"
          value={lessonForm.title}
          onChange={handleLessonFormChange}
          placeholder="Lesson Title"
          className="w-full mb-2 px-3 py-2 border rounded"
          aria-required="true"
          aria-label="Lesson Title"
          autoFocus
        />
        <label htmlFor="lesson-content-type" className="block font-medium mb-1">
          Content Type
        </label>
        <select
          id="lesson-content-type"
          name="content_type"
          value={lessonForm.content_type}
          onChange={handleLessonFormChange}
          className="w-full mb-2 px-3 py-2 border rounded"
          aria-label="Content Type"
        >
          <option value="text">Text</option>
          <option value="video">Video</option>
          <option value="document">Document</option>
          <option value="assignment">Assignment</option>
        </select>
        {lessonForm.content_type === "text" && (
          <>
            <label htmlFor="lesson-content" className="block font-medium mb-1">
              Content
            </label>
            <RichTextEditor
              value={lessonForm.content}
              onChange={(val) =>
                setLessonForm((prev) => ({ ...prev, content: val }))
              }
              placeholder="Lesson Content (Markdown or rich text supported)"
              className="w-full mb-2"
              ariaLabel="Lesson Content"
              tabIndex={0}
            />
          </>
        )}
        {lessonForm.content_type === "assignment" && (
          <>
            <label
              htmlFor="assignment-description"
              className="block font-medium mb-1"
            >
              Assignment Description
            </label>
            <RichTextEditor
              value={lessonForm.assignment.description}
              onChange={(val) =>
                setLessonForm((prev) => ({
                  ...prev,
                  assignment: { ...prev.assignment, description: val },
                }))
              }
              placeholder="Assignment Description (Markdown or rich text supported)"
              className="w-full mb-2"
              ariaLabel="Assignment Description"
              tabIndex={0}
            />
            <label
              htmlFor="assignment-instructions"
              className="block font-medium mb-1"
            >
              Instructions
            </label>
            <RichTextEditor
              value={lessonForm.assignment.instructions}
              onChange={(val) =>
                setLessonForm((prev) => ({
                  ...prev,
                  assignment: { ...prev.assignment, instructions: val },
                }))
              }
              placeholder="Instructions (Markdown or rich text supported)"
              className="w-full mb-2"
              ariaLabel="Assignment Instructions"
              tabIndex={0}
            />
            <label
              htmlFor="assignment-deadline"
              className="block font-medium mb-1"
            >
              Deadline
            </label>
            <input
              type="datetime-local"
              id="assignment-deadline"
              name="deadline"
              value={lessonForm.assignment.deadline}
              onChange={handleLessonFormChange}
              className="w-full mb-2 px-3 py-2 border rounded"
              required
            />
            <label
              htmlFor="assignment-max-score"
              className="block font-medium mb-1"
            >
              Max Score
            </label>
            <input
              type="number"
              id="assignment-max-score"
              name="max_score"
              value={lessonForm.assignment.max_score}
              onChange={handleLessonFormChange}
              className="w-full mb-2 px-3 py-2 border rounded"
              min={1}
              required
            />
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                name="allow_late_submission"
                checked={lessonForm.assignment.allow_late_submission}
                onChange={handleLessonFormChange}
                className="mr-2"
              />
              Allow Late Submission
            </label>
          </>
        )}
        <div className="flex gap-2 mt-4">
          <PrimaryButton
            onClick={handleLessonSave}
            className="px-4 py-2"
            disabled={lessonSaving}
            aria-label="Save Lesson"
          >
            Save
          </PrimaryButton>
          <SecondaryButton
            onClick={closeLessonModal}
            className="px-4 py-2"
            aria-label="Cancel"
          >
            Cancel
          </SecondaryButton>
        </div>
      </ReactModal>
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Questions</h3>
          <PrimaryButton
            className="px-3 py-1"
            onClick={() => openQuestionModal()}
          >
            + Add Question
          </PrimaryButton>
        </div>
        {loadingQuestions ? (
          <LoadingSkeleton lines={2} />
        ) : questionsError ? (
          <div className="text-red-500">{questionsError}</div>
        ) : questions.length === 0 ? (
          <div className="text-gray-500">No questions yet.</div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleQuestionDragEnd}
          >
            <SortableContext
              items={questions.map((q, i) => i)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {questions.map((q, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center p-2 bg-gray-100 rounded"
                  >
                    <span>{q.question_text}</span>
                    <div className="flex gap-2">
                      <PrimaryButton
                        className="px-2 py-1 text-xs"
                        onClick={() => openQuestionModal(q)}
                      >
                        Edit
                      </PrimaryButton>
                      <DangerButton
                        className="px-2 py-1 text-xs"
                        onClick={() => handleDeleteQuestion(q)}
                      >
                        Delete
                      </DangerButton>
                    </div>
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        <QuestionEditorModal
          open={questionModal.open}
          onClose={closeQuestionModal}
          question={questionModal.question}
          onSave={handleSaveQuestion}
        />
      </div>
      {/* Quiz Preview Modal */}
      <ReactModal
        isOpen={!!previewQuiz}
        onRequestClose={handleClosePreview}
        contentLabel="Quiz Preview"
        ariaHideApp={false}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h3 className="text-lg font-semibold mb-4">
          Quiz Preview: {previewQuiz?.title}
        </h3>
        {previewLoading ? (
          <LoadingSkeleton lines={4} />
        ) : previewError ? (
          <div className="text-red-500">{previewError}</div>
        ) : previewQuestions.length === 0 ? (
          <div className="text-gray-500">No questions in this quiz.</div>
        ) : (
          <div className="space-y-6">
            {previewQuestions.map((q, idx) => (
              <div key={q.id || idx} className="border rounded p-4 bg-gray-50">
                <div className="font-medium mb-2">
                  Q{idx + 1}:{" "}
                  <span
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(q.question_text),
                    }}
                  />
                </div>
                {q.question_type === "multiple_choice" && (
                  <ul className="space-y-1">
                    {q.options.map((opt, i) => (
                      <li key={i} className="flex items-center">
                        <input type="radio" disabled className="mr-2" />
                        <span>{opt.option_text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {q.question_type === "multiple_select" && (
                  <ul className="space-y-1">
                    {q.options.map((opt, i) => (
                      <li key={i} className="flex items-center">
                        <input type="checkbox" disabled className="mr-2" />
                        <span>{opt.option_text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {q.question_type === "true_false" && (
                  <ul className="space-y-1">
                    {q.options.map((opt, i) => (
                      <li key={i} className="flex items-center">
                        <input type="radio" disabled className="mr-2" />
                        <span>{opt.option_text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        <SecondaryButton
          onClick={handleClosePreview}
          className="mt-6 px-4 py-2"
        >
          Close
        </SecondaryButton>
      </ReactModal>
    </div>
  );
};

export default CourseEditor;
