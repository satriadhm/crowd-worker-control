import { TaskView } from '../dto/views/task.view.input';

export const parseToView = (input: any): TaskView => {
  return {
    id: input._id,
    isValidQuestion: false,
    title: input.title,
    description: input.description,
    question: input.question,
    nAnswers: input.answers.length,
    answers: input.answers,
  };
};

export const parseRequest = (input: any): any => {
  return {
    title: input.title,
    description: input.description,
    isValidQuestion: false,
    question: input.question,
    answers: input.answers,
    nAnswers: input.answers.length,
  };
};
