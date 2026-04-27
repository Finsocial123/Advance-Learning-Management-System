"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/TextArea";
import Button from "@/components/ui/Button";
import { Assignment } from "@/types";
import { Calendar } from "lucide-react";

interface AssignmentFormProps {
  initial?: Partial<Assignment>;
  onSubmit: (data: {
    title: string;
    description: string;
    due_date: string;
  }) => Promise<void>;
  submitLabel?: string;
}

export default function AssignmentForm({
  initial,
  onSubmit,
  submitLabel = "Create Assignment",
}: AssignmentFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [dueDate, setDueDate] = useState(
    initial?.due_date
      ? new Date(initial.due_date).toISOString().slice(0, 16)
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const validate = () => {
    const e: { title?: string } = {};
    if (!title.trim()) e.title = "Title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ title, description, due_date: dueDate });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Assignment Title"
        placeholder="e.g. Build a Calculator App"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      <Textarea
        label="Instructions"
        placeholder="Describe the requirements and objectives..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
      />

      <div className="relative">
        <Input
          label="Due Date"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          hint="Students won't be able to submit after this date"
        />
        <Calendar
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          size={18}
        />
      </div>

      <Button type="submit" loading={loading} fullWidth className="mt-4 py-4">
        {submitLabel}
      </Button>
    </form>
  );
}
