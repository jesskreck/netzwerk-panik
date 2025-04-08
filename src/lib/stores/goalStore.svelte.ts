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

function handleGoalCompletion(goals: string[], isComplete: boolean) {
  goalStore.goals = goals;
  goalStore.isComplete = isComplete;
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