import { IssueCode, DatasetIssue } from '@botpress/nlu-client'

export const issueGuard = <C extends IssueCode>(c: C) => (i: DatasetIssue<IssueCode>): i is DatasetIssue<C> => {
  return i.code === c
}
