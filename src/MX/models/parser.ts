import { EligibilityView } from '../dto/eligibility/views/eligibility.view';

export const parseToViewEligibility = (input: any): EligibilityView => {
  return {
    id: input._id,
    workerId: input.workerId,
    accuracy: input.accuracy,
    feedback: input.feedback,
    Date: input.Date,
    taskId: input.taskId,
  };
};
