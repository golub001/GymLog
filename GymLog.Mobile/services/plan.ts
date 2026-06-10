import { api } from "./api";
import { PlanListItem, PlanDetail } from "../dto/plan";

export async function getTemplates(): Promise<PlanListItem[]> {
  try {
    const response = await api.get<PlanListItem[]>("/plans/templates");
    return response.data;
  } catch {
    return [];
  }
}

export async function getMyPlans(): Promise<PlanListItem[]> {
  try {
    const response = await api.get<PlanListItem[]>("/plans");
    return response.data;
  } catch {
    return [];
  }
}

export async function getActivePlan(): Promise<PlanDetail | null> {
  try {
    const response = await api.get<PlanDetail>("/plans/active");

    if (response.status === 204 || !response.data) return null;
    return response.data;
  } catch {
    return null;
  }
}

export async function getPlanById(id: number): Promise<PlanDetail | null> {
  try {
    const response = await api.get<PlanDetail>(`/plans/${id}`);
    return response.data;
  } catch {
    return null;
  }
}

export async function useTemplate(templateId: number): Promise<number | null> {
  try {
    const response = await api.post<{ planId: number }>(
      `/plans/from-template/${templateId}`
    );
    return response.data.planId;
  } catch {
    return null;
  }
}

export async function activatePlan(id: number): Promise<boolean> {
  try {
    await api.post(`/plans/${id}/activate`);
    return true;
  } catch {
    return false;
  }
}

export async function deletePlan(id: number): Promise<boolean> {
  try {
    await api.delete(`/plans/${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function generatePlan(
  prompt: string,
  equipment: string[],
  days: number | null
): Promise<number | null> {
  try {
    const res = await api.post<{ planId: number }>("/plans/generate", {
      prompt,
      equipment,
      days,
    });
    return res.data.planId;
  } catch {
    return null;
  }
}

export async function addPlanExercise(
  dayId: number,
  exerciseId: number,
  targetSets: number,
  targetReps: number
): Promise<number | null> {
  try {
    const res = await api.post<{ planExerciseId: number }>(
      `/plans/days/${dayId}/exercises`,
      { exerciseId, targetSets, targetReps }
    );
    return res.data.planExerciseId;
  } catch {
    return null;
  }
}

export async function removePlanExercise(
  planExerciseId: number
): Promise<boolean> {
  try {
    await api.delete(`/plans/exercises/${planExerciseId}`);
    return true;
  } catch {
    return false;
  }
}

export async function updatePlanExercise(
  planExerciseId: number,
  targetSets: number,
  targetReps: number
): Promise<boolean> {
  try {
    await api.patch(`/plans/exercises/${planExerciseId}`, {
      targetSets,
      targetReps,
    });
    return true;
  } catch {
    return false;
  }
}
