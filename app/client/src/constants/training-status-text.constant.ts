import TrainingStatus from "@/types/training-status.enum";

const trainingStatusText: Record<TrainingStatus, string> = {
  [TrainingStatus.NotStarted]: "Not started",
  [TrainingStatus.Finished]: "Finished",
  [TrainingStatus.InProgress]: "In progress",
  [TrainingStatus.RequestedToStop]: "Waiting to stop",
  [TrainingStatus.Stopped]: "Stopped",
};

export default trainingStatusText;
