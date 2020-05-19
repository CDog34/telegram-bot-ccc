type TAsyncTask = () => Promise<any>

export class AsyncQueue {
  private _queue: TAsyncTask[] = []
  private _isExecuting: boolean = false

  private async _execute () {
    if (this._isExecuting) {
      return
    }
    this._isExecuting = true
    try {
      const func = this._queue.shift()
      if (func && func.call) {
        await func.call(null)
      }
    } catch (e) {
      console.warn('Async task execute fail:', e)
    }
    this._isExecuting = false
    this._executeNextTick()
  }

  private _executeNextTick () {
    if (this._queue.length) {
      new Promise(res => res()).then(() => this._execute())
    }
  }

  public addTask (task: TAsyncTask) {
    this._queue.push(task)
    this._executeNextTick()
  }

}
