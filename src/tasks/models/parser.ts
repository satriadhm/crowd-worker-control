import { TaskView } from '../dto/views/task.view.input';

export const parseToView = (input: any): TaskView => {
  return {
    title: input.title,
    description: input.description,
    question: input.question,
    nAnswers: input.answers.length,
    answers: input.answers,
  };
};
