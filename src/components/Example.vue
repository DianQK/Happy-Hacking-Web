<template>
  <div class="example">
    <div class="tool-bar">
      <VueInput
        v-model="cwd"
        placeholder="工作目录"
      />

      <VueInput
        v-model="command"
        placeholder="执行命令"
      />

      <VueButton
        label="Run"
        icon-left="flash_on"
        class="primary"
        @click="runTask()"
      />
    </div>

    <div class="content">
      <TerminalView
        ref="terminal"
        :cols="100"
        :rows="24"
        auto-size
        :options="{
          scrollback: 5000,
          disableStdin: true,
          useFlowControl: true
        }"
        title="Output"
        toolbar
        open-links
      />
    </div>
  </div>
</template>

<script>
import TASK_RUN from '@/graphql/taskRun.gql'
import TASK_LOG_ADDED from '@/graphql/taskLogAdded.gql'

export default {
  data () {
    return {
      command: 'pwd',
      cwd: './'
    }
  },

  apollo: {
    $subscribe: {
      taskLogAdded: {
        query: TASK_LOG_ADDED,
        variables () {
          return {
            id: '1'
          }
        },
        async result ({ data }) {
          if (data.taskLogAdded.taskId === '1') {
            await this.$nextTick()
            const terminal = this.$refs.terminal
            terminal.addLog(data.taskLogAdded)
          }
        }
      }
    }
  },

  methods: {
    runTask () {
      this.$apollo.mutate({
        mutation: TASK_RUN,
        variables: {
          id: '1',
          command: this.command,
          cwd: this.cwd
        }
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.tool-bar
  > *
    margin 0 10px
.example
  v-box()
  align-items stretch
  height 100vh
.content
  flex auto 1 1
  height 500px
  margin 30px
  position relative
.terminal-view
  position absolute
  top 0
  left 0
  width 100%
  height 100%
  border-radius $br
</style>

<style scoped>
.form,
.input,
.apollo,
.message {
  padding: 12px;
}

label {
  display: block;
  margin-bottom: 6px;
}

.input {
  font-family: inherit;
  font-size: inherit;
  border: solid 2px #ccc;
  border-radius: 3px;
}

.error {
  color: red;
}

.images {
  display: grid;
  grid-template-columns: repeat(auto-fill, 300px);
  grid-auto-rows: 300px;
  grid-gap: 10px;
}

.image-item {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ccc;
  border-radius: 8px;
}

.image {
  max-width: 100%;
  max-height: 100%;
}

.image-input {
  margin: 20px;
}
</style>
