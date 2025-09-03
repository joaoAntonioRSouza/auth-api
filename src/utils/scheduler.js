const Logger = require("./logger")

class TaskScheduler {
  constructor() {
    this.tasks = new Map()
    this.intervals = new Map()
  }

  /**
   * Agenda uma tarefa para execução periódica
   * @param {string} name - Nome da tarefa
   * @param {Function} task - Função a ser executada
   * @param {number} intervalMs - Intervalo em milissegundos
   */
  schedule(name, task, intervalMs) {
    try {
      if (this.intervals.has(name)) {
        Logger.warn(`Tarefa ${name} já está agendada, cancelando anterior`)
        this.cancel(name)
      }

      const interval = setInterval(async () => {
        try {
          Logger.debug(`Executando tarefa agendada: ${name}`)
          await task()
        } catch (error) {
          Logger.error(`Erro na tarefa agendada ${name}:`, error)
        }
      }, intervalMs)

      this.tasks.set(name, task)
      this.intervals.set(name, interval)

      Logger.info(`Tarefa ${name} agendada para execução a cada ${intervalMs}ms`)
    } catch (error) {
      Logger.error(`Erro ao agendar tarefa ${name}:`, error)
    }
  }

  /**
   * Cancela uma tarefa agendada
   * @param {string} name - Nome da tarefa
   */
  cancel(name) {
    try {
      const interval = this.intervals.get(name)
      if (interval) {
        clearInterval(interval)
        this.intervals.delete(name)
        this.tasks.delete(name)
        Logger.info(`Tarefa ${name} cancelada`)
      }
    } catch (error) {
      Logger.error(`Erro ao cancelar tarefa ${name}:`, error)
    }
  }

  /**
   * Cancela todas as tarefas
   */
  cancelAll() {
    try {
      for (const [name] of this.intervals) {
        this.cancel(name)
      }
      Logger.info("Todas as tarefas agendadas foram canceladas")
    } catch (error) {
      Logger.error("Erro ao cancelar todas as tarefas:", error)
    }
  }

  /**
   * Lista tarefas ativas
   */
  listTasks() {
    return Array.from(this.tasks.keys())
  }
}

module.exports = new TaskScheduler()
