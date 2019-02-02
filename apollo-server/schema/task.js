import gql from 'graphql-tag'
// Subs
import { withFilter } from 'graphql-subscriptions'
import channels from '../channels'
import tasks from '../connectors/tasks'

export const types = gql`
extend type Query {
  tasks: [Task]
  task (id: ID!): Task
}

extend type Mutation {
  taskRun (id: ID!, command: String!, cwd: String): Task
}

extend type Subscription {
  taskLogAdded (id: ID!): TaskLog
}

type Task implements DescribedEntity {
  id: ID!
  status: TaskStatus!
  command: String!
  name: String
  description: String
  link: String
  icon: String
  logs: [TaskLog]
  views: [TaskView]
  defaultView: String
}

enum TaskStatus {
  idle
  running
  done
  error
  terminated
}

type TaskLog {
  taskId: ID!
  type: TaskLogType!
  text: String
}

enum TaskLogType {
  stdout
  stderr
}

type TaskView {
  id: ID!
  label: String!
  component: String!
  icon: String
}
`

export const resolvers = {
  Mutation: {
    taskRun: (root, args, context) => tasks.run(args, context)
  },
  Subscription: {
    taskLogAdded: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(channels.TASK_LOG_ADDED),
        (payload, vars) => payload.taskLogAdded.taskId === vars.id
      )
    }
  }
}
