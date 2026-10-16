import { CustomTimerState, SimpleDirection, SimplePlayback } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { SimpleTimer } from '../../classes/simple-timer/SimpleTimer.js';
import { timerConfig } from '../../setup/config.js';
import { eventStore } from '../../stores/EventStore.js';

type EmitFn = (timers: CustomTimerState[]) => void;
type GetTimeFn = () => number;

/**
 * Manages an unbounded number of user-created timers, alongside (not replacing) the fixed
 * auxtimer1/2/3 handled by AuxTimerService. Those three are a separate, long-standing surface
 * that the OSC/HTTP integration API and existing automations already address by exact index -
 * this is deliberately an additive sibling, not a replacement, so none of that breaks.
 *
 * Like the aux timers, these are runtime-only: they do not persist across a server restart or
 * get saved into the project file. That matches the aux timers' own existing behaviour rather
 * than introducing a new persistence/migration surface for a first version of this feature.
 */
export class CustomTimerService {
  private timers = new Map<string, SimpleTimer>();
  private interval: NodeJS.Timeout | null = null;
  protected emit: EmitFn;
  private getTime: GetTimeFn;

  constructor(emit: EmitFn, getTime: GetTimeFn) {
    this.emit = emit;
    this.getTime = getTime;
  }

  private snapshot(): CustomTimerState[] {
    return Array.from(this.timers.entries()).map(([id, timer]) => ({ id, ...timer.state }));
  }

  private broadcast() {
    this.emit(this.snapshot());
  }

  private getOrThrow(id: string): SimpleTimer {
    const timer = this.timers.get(id);
    if (!timer) {
      throw new Error(`No custom timer with id ${id}`);
    }
    return timer;
  }

  private hasActiveTimers(): boolean {
    for (const timer of this.timers.values()) {
      if (timer.state.playback === SimplePlayback.Start) return true;
    }
    return false;
  }

  private startInterval() {
    if (!this.interval) {
      this.interval = setInterval(this.update.bind(this), 500);
    }
  }

  private stopInterval() {
    if (this.interval && !this.hasActiveTimers()) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  add(name: string = ''): CustomTimerState[] {
    const id = generateId();
    const timer = new SimpleTimer(timerConfig.auxTimerDefault);
    timer.setName(name);
    this.timers.set(id, timer);
    this.broadcast();
    return this.snapshot();
  }

  remove(id: string): CustomTimerState[] {
    this.timers.delete(id);
    this.stopInterval();
    this.broadcast();
    return this.snapshot();
  }

  rename(id: string, name: string): CustomTimerState[] {
    this.getOrThrow(id).setName(name);
    this.broadcast();
    return this.snapshot();
  }

  start(id: string): CustomTimerState[] {
    this.startInterval();
    this.getOrThrow(id).start(this.getTime());
    this.broadcast();
    return this.snapshot();
  }

  pause(id: string): CustomTimerState[] {
    this.getOrThrow(id).pause(this.getTime());
    this.stopInterval();
    this.broadcast();
    return this.snapshot();
  }

  stop(id: string): CustomTimerState[] {
    this.getOrThrow(id).stop();
    this.stopInterval();
    this.broadcast();
    return this.snapshot();
  }

  setTime(id: string, duration: number): CustomTimerState[] {
    this.getOrThrow(id).setTime(duration);
    this.broadcast();
    return this.snapshot();
  }

  addTime(id: string, millis: number): CustomTimerState[] {
    const timer = this.getOrThrow(id);
    timer.addTime(millis);
    if (timer.state.playback === SimplePlayback.Start) {
      timer.update(this.getTime());
    }
    this.broadcast();
    return this.snapshot();
  }

  setDirection(id: string, direction: SimpleDirection): CustomTimerState[] {
    this.getOrThrow(id).setDirection(direction, this.getTime());
    this.broadcast();
    return this.snapshot();
  }

  private update() {
    const timeNow = this.getTime();
    let changed = false;
    for (const timer of this.timers.values()) {
      if (timer.state.playback === SimplePlayback.Start) {
        timer.update(timeNow);
        changed = true;
      }
    }
    if (changed) {
      this.broadcast();
    }
  }
}

const emit = (timers: CustomTimerState[]) => {
  eventStore.set('customTimers', timers);
};
const timeNow = () => Date.now();

export const customTimerService = new CustomTimerService(emit, timeNow);
