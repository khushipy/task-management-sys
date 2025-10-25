"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Bot,
  MessageSquare,
  Sparkles,
  Edit,
  Trash2,
  X,
  Home,
} from "lucide-react";

export default function ProjectPage({ params }) {
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      const data = await response.json();
      setProject(data.project);
      setColumns(data.columns);
      setTasks(data.tasks);
    } catch (error) {
      console.error("Error fetching project:", error);
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !selectedColumn) return;

    setCreating(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: parseInt(params.id),
          column_id: selectedColumn.id,
          title: newTask.title,
          description: newTask.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const data = await response.json();
      setTasks((prev) => [...prev, data.task]);
      setNewTask({ title: "", description: "" });
      setShowTaskForm(false);
      setSelectedColumn(null);
    } catch (error) {
      console.error("Error creating task:", error);
      setError("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const data = await response.json();
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? data.task : task)),
      );
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task");
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.column_id === targetColumnId) {
      setDraggedTask(null);
      return;
    }

    try {
      const tasksInTargetColumn = tasks.filter(
        (task) => task.column_id === targetColumnId,
      );
      const newPosition = tasksInTargetColumn.length + 1;

      const response = await fetch("/api/tasks/move", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: draggedTask.id,
          newColumnId: targetColumnId,
          newPosition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to move task");
      }

      const data = await response.json();
      setTasks((prev) =>
        prev.map((task) => (task.id === draggedTask.id ? data.task : task)),
      );
    } catch (error) {
      console.error("Error moving task:", error);
      setError("Failed to move task");
    } finally {
      setDraggedTask(null);
    }
  };

  const handleAISummarize = async () => {
    setAiLoading(true);
    setAiResponse("");
    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: parseInt(params.id) }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI summary");
      }

      const data = await response.json();
      setAiResponse(data.summary);
    } catch (error) {
      console.error("Error getting AI summary:", error);
      setAiResponse("Failed to generate summary. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIQuestion = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiResponse("");
    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: parseInt(params.id),
          question: aiQuestion,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      setAiResponse(data.answer);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setAiResponse("Failed to get response. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const getTasksForColumn = (columnId) => {
    return tasks
      .filter((task) => task.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  };

  const navigateHome = () => {
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg border border-slate-200 p-12 max-w-md mx-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Project not found
          </h2>
          <p className="text-slate-600 mb-6">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={navigateHome}
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={navigateHome}
                className="mr-4 p-3 text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="mt-2 text-slate-600">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAIPanel(true)}
                className="inline-flex items-center px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Bot className="w-5 h-5 mr-2" />
                AI Assistant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-800 text-lg">
                  {column.name}
                </h3>
                <button
                  onClick={() => {
                    setSelectedColumn(column);
                    setShowTaskForm(true);
                  }}
                  className="p-2 text-slate-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {getTasksForColumn(column.id).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-move hover:shadow-md hover:bg-white transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    {editingTask === task.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          defaultValue={task.title}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateTask(task.id, {
                                title: e.target.value,
                              });
                            } else if (e.key === "Escape") {
                              setEditingTask(null);
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingTask(null)}
                            className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-slate-800 text-sm leading-relaxed">
                            {task.title}
                          </h4>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingTask(task.id)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Creation Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">
              Add Task to {selectedColumn?.name}
            </h2>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Task Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Describe the task..."
                  rows={4}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={creating || !newTask.title.trim()}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {creating ? "Creating..." : "Create Task"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskForm(false);
                    setNewTask({ title: "", description: "" });
                    setSelectedColumn(null);
                  }}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Assistant Panel */}
      {showAIPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-8 border-b border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-800 flex items-center">
                <Bot className="w-7 h-7 mr-3 text-violet-600" />
                AI Assistant
              </h2>
              <button
                onClick={() => setShowAIPanel(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              <div className="space-y-6">
                <button
                  onClick={handleAISummarize}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center px-6 py-4 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {aiLoading ? "Analyzing..." : "Summarize Project"}
                </button>

                <div className="border-t border-slate-200 pt-6">
                  <form onSubmit={handleAIQuestion} className="space-y-4">
                    <div>
                      <label
                        htmlFor="question"
                        className="block text-sm font-medium text-slate-700 mb-2"
                      >
                        Ask a question about your project
                      </label>
                      <textarea
                        id="question"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                        placeholder="What tasks need attention? Which should I prioritize? How's the progress looking?"
                        rows={3}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={aiLoading || !aiQuestion.trim()}
                      className="flex items-center px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {aiLoading ? "Thinking..." : "Ask AI"}
                    </button>
                  </form>
                </div>

                {aiResponse && (
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
                      <Bot className="w-5 h-5 mr-2 text-violet-600" />
                      AI Response
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-6 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
                      {aiResponse}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
