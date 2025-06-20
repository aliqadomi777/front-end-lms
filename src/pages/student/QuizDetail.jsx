import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getQuizById,
  startQuizAttempt,
  submitQuizAttempt,
} from "../../api/quizzes";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useForm } from "react-hook-form";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import EmptyState from "../../components/EmptyState";

const QuizDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const { addToast } = useToast();
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const { register, handleSubmit, reset } = useForm();
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef();
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  // Fetch quiz details
  const {
    data: quizData,
    isLoading: quizLoading,
    isError: quizError,
    error: quizErrObj,
    refetch: refetchQuiz,
  } = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => getQuizById(id),
    enabled: !!id,
    onError: (err) => addToast("error", err.message || "Failed to load quiz"),
  });

  // Start attempt mutation
  const startMutation = useMutation({
    mutationFn: () => startQuizAttempt(token, id),
    onSuccess: (data) => {
      setAttempt(data.attempt);
      addToast("success", "Quiz attempt started!");
      reset();
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to start attempt"),
  });

  // Submit attempt mutation
  const submitMutation = useMutation({
    mutationFn: (answers) => submitQuizAttempt(token, id, answers),
    onSuccess: (data) => {
      setResult(data.result);
      addToast("success", "Quiz submitted!");
    },
    onError: (err) => addToast("error", err.message || "Failed to submit quiz"),
  });

  // Track attempts left
  useEffect(() => {
    if (
      quizData &&
      quizData.quiz &&
      quizData.quiz.attempt_limit !== undefined &&
      quizData.quiz.attempts_used !== undefined
    ) {
      setAttemptsLeft(
        quizData.quiz.attempt_limit - quizData.quiz.attempts_used
      );
    }
  }, [quizData]);

  // Timer logic
  useEffect(() => {
    if (
      attempt &&
      quizData &&
      quizData.quiz &&
      quizData.quiz.time_limit_minutes
    ) {
      setTimeLeft(quizData.quiz.time_limit_minutes * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            clearInterval(timerRef.current);
            // Auto-submit
            document.getElementById("quiz-submit-btn")?.click();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [attempt, quizData]);

  if (quizLoading) {
    return <LoadingSkeleton lines={8} className="mt-10 max-w-2xl mx-auto" />;
  }
  if (quizError) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 mb-4">{quizErrObj.message}</p>
        <PrimaryButton onClick={() => refetchQuiz()}>Retry</PrimaryButton>
      </div>
    );
  }

  const { quiz } = quizData || {};
  if (!quiz) return null;

  // If result exists, show result summary
  if (result) {
    return (
      <Panel className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Quiz Results</h1>
        <div className="mb-4">
          Score: <span className="font-semibold">{result.score}</span>
        </div>
        <div className="mb-4">{result.passed ? "Passed" : "Failed"}</div>
        {/* Optionally show detailed feedback */}
        <PrimaryButton
          onClick={() => {
            setResult(null);
            setAttempt(null);
            reset();
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Retake Quiz
        </PrimaryButton>
      </Panel>
    );
  }

  // If no attempt, show start button
  if (!attempt) {
    return (
      <Panel className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-gray-600 mb-4">{quiz.description}</p>
        {quiz.attempt_limit !== undefined && (
          <div className="mb-2 text-sm text-gray-700">
            Attempts left: {attemptsLeft}
          </div>
        )}
        <PrimaryButton
          onClick={() => startMutation.mutate()}
          className="bg-green-600 hover:bg-green-700"
          disabled={startMutation.isLoading || attemptsLeft === 0}
        >
          {attemptsLeft === 0
            ? "No Attempts Left"
            : startMutation.isLoading
            ? "Starting..."
            : "Start Quiz"}
        </PrimaryButton>
      </Panel>
    );
  }

  // Render quiz questions
  const onSubmit = (data) => {
    // Convert form data to answers array
    const answers = Object.entries(data).map(([questionId, value]) => ({
      questionId,
      answer: value,
    }));
    submitMutation.mutate(answers);
  };

  return (
    <Panel className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
      {quiz.time_limit_minutes && timeLeft !== null && (
        <div className="mb-4 text-red-600 font-semibold">
          Time Left: {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {quiz.questions && quiz.questions.length > 0 ? (
          quiz.questions.map((q, idx) => (
            <Panel key={q.id} className="p-4">
              <div className="font-semibold mb-2">
                {idx + 1}. {q.text}
              </div>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={opt.id}
                      {...register(q.id, { required: true })}
                      className="form-radio text-blue-600"
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            </Panel>
          ))
        ) : (
          <EmptyState message="No questions found for this quiz." />
        )}
        <PrimaryButton
          id="quiz-submit-btn"
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={submitMutation.isLoading}
        >
          {submitMutation.isLoading ? "Submitting..." : "Submit Quiz"}
        </PrimaryButton>
      </form>
    </Panel>
  );
};

export default QuizDetail;
