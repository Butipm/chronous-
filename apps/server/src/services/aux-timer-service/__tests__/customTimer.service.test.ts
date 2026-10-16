import { CustomTimerState, SimpleDirection, SimplePlayback } from 'ontime-types';

import { CustomTimerService } from '../customTimer.service.js';

describe('CustomTimerService', () => {
  let emit: ReturnType<typeof vi.fn>;
  let service: CustomTimerService;
  let now: number;

  beforeEach(() => {
    emit = vi.fn();
    now = 0;
    service = new CustomTimerService(emit, () => now);
  });

  const lastSnapshot = () => emit.mock.calls.at(-1)?.[0] as CustomTimerState[];

  it('adds a timer and broadcasts it with a generated id', () => {
    const snapshot = service.add('Speaker Q&A');

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].name).toBe('Speaker Q&A');
    expect(typeof snapshot[0].id).toBe('string');
    expect(snapshot[0].id.length).toBeGreaterThan(0);
    expect(lastSnapshot()).toEqual(snapshot);
  });

  it('defaults to an unnamed timer when no name is given', () => {
    const snapshot = service.add();
    expect(snapshot[0].name).toBe('');
  });

  it('supports adding any number of timers, not a fixed count', () => {
    service.add('One');
    service.add('Two');
    const snapshot = service.add('Three');

    expect(snapshot).toHaveLength(3);
    expect(snapshot.map((t) => t.name)).toEqual(['One', 'Two', 'Three']);
  });

  it('removes a timer by id without touching the others', () => {
    const [a] = service.add('A');
    const [, b] = service.add('B');

    const afterRemoval = service.remove(b.id);

    expect(afterRemoval.find((t) => t.id === b.id)).toBeUndefined();
    expect(afterRemoval.find((t) => t.id === a.id)).toBeDefined();
  });

  it('renames a timer', () => {
    const [timer] = service.add('Original');
    const snapshot = service.rename(timer.id, 'Renamed');
    expect(snapshot[0].name).toBe('Renamed');
  });

  it('starts, pauses and stops a timer independently of others', () => {
    const [a] = service.add('A');
    const [, b] = service.add('B');

    service.start(a.id);
    let snapshot = service.pause(b.id); // b was never started - pause is a no-op on a stopped timer
    const aAfter = snapshot.find((t) => t.id === a.id);
    const bAfter = snapshot.find((t) => t.id === b.id);
    expect(aAfter?.playback).toBe(SimplePlayback.Start);
    expect(bAfter?.playback).toBe(SimplePlayback.Stop);

    snapshot = service.stop(a.id);
    expect(snapshot.find((t) => t.id === a.id)?.playback).toBe(SimplePlayback.Stop);
  });

  it('counts down from the set duration as time advances', () => {
    const [timer] = service.add('Countdown');
    service.setTime(timer.id, 10_000);
    service.setDirection(timer.id, SimpleDirection.CountDown);
    service.start(timer.id);

    now = 4_000;
    const snapshot = service.addTime(timer.id, 0); // trigger an update-in-place at the new "now"
    expect(snapshot.find((t) => t.id === timer.id)?.current).toBe(6_000);
  });

  it('throws for an unknown id instead of silently no-opping', () => {
    expect(() => service.start('does-not-exist')).toThrow();
  });
});
