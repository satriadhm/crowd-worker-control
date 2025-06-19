import { TaskView } from '../dto/views/task.view.input';

export const parseToView = (input: any): TaskView => {
  const answers = Array.isArray(input.answers) ? input.answers : [];
  return {
    id: input._id?.toString() || '',
    isValidQuestion: input.isValidQuestion,
    title: input.title,
    description: input.description,
    question: {
      scenario: input.question?.scenario || '',
      given: input.question?.given || '',
      when: input.question?.when || '',
      then: input.question?.then || '',
    },
    nAnswers: answers.length,
    answers,
  };
};

export const parseRequest = (input: any): any => {
  const answers = Array.isArray(input.answers) ? input.answers : [];
  return {
    title: input.title,
    description: input.description,
    isValidQuestion: false,
    question: {
      scenario: input.question?.scenario || '',
      given: input.question?.given || '',
      when: input.question?.when || '',
      then: input.question?.then || '',
    },
    answers,
    nAnswers: answers.length,
  };
};
