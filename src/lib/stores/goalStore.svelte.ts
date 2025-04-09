import { goto } from '$app/navigation';

const goalStore = $state({
  goals: [] as string[],
  isComplete: false
});


function addGoal(goal: string) {
  if (goal.trim()) {
    goalStore.goals.push(goal.trim());
  }
}

// für /api/respond/+server.ts: Storeupdate wenn tool call von API ausgelöst wird (function calling) 
function handleGoalCompletion(goals?: string[], completed?: boolean) {
  if (goals) {
    goalStore.goals = goals;
  }
  if (completed !== undefined) {
    goalStore.isComplete = completed;
  }
}
function proceedToNextStage() {
  if (goalStore.isComplete) {
    goto('/themen');
  }
}

export { 
  goalStore,
  addGoal, 
  handleGoalCompletion, 
  proceedToNextStage 
};