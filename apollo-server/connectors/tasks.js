import execa from 'execa'
import channels from '../channels'

function logPipe (action) {
  const maxTime = 300

  let queue = ''
  let size = 0
  let time = Date.now()
  let timeout

  const add = (string) => {
    queue += string
    size++

    if (size === 50 || Date.now() > time + maxTime) {
      flush()
    } else {
      clearTimeout(timeout)
      timeout = setTimeout(flush, maxTime)
    }
  }

  const flush = () => {
    clearTimeout(timeout)
    if (!size) return
    action(queue)
    queue = ''
    size = 0
    time = Date.now()
  }

  return {
    add,
    flush
  }
}

function addLog (log, context) {
  // const task = findOne(log.taskId, context)
  // if (task) {
    // if (task.logs.length === MAX_LOGS) {
    //   task.logs.shift()
    // }
    // task.logs.push(log) // TODO: 提供 log 的查询功能
  context.pubsub.publish(channels.TASK_LOG_ADDED, {
    taskLogAdded: log
  })
  // }
}

async function run (task, context) {
  let { id, command, cwd = './' } = task
  let args = []

  // Output colors
  // See: https://www.npmjs.com/package/supports-color
  process.env.FORCE_COLOR = 1

  // Process command containing args
  if (command.indexOf(' ')) {
    const parts = command.split(/\s+/)
    command = parts.shift()
    args = parts
  }
  const child = execa(command, args, {
    cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  })

  const outPipe = logPipe(queue => {
    addLog({
      taskId: id,
      type: 'stdout',
      text: queue
    }, context)
  })
  child.stdout.on('data', buffer => {
    outPipe.add(buffer.toString())
  })

  const errPipe = logPipe(queue => {
    addLog({
      taskId: id,
      type: 'stderr',
      text: queue
    }, context)
  })
  child.stderr.on('data', buffer => {
    errPipe.add(buffer.toString())
  })

  const onExit = async (code, signal) => {
    outPipe.flush()
    errPipe.flush()
  }
  child.on('exit', onExit)
  child.on('error', error => {
    console.error(error)
  })
}

export default {
  run
}
