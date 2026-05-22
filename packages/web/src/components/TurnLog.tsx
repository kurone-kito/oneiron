import type { LogEntry } from '@kurone-kito/oneiron-core';
import { createEffect, createSignal, For } from 'solid-js';

type Props = {
  entries: LogEntry[];
  /**
   * Whether the log starts expanded. Defaults to `false` so the
   * mobile layout doesn't pre-claim vertical space; tests and
   * desktop callers can pass `true` to opt out.
   */
  defaultOpen?: boolean;
};

export function TurnLog(props: Props) {
  let listRef: HTMLOListElement | undefined;
  const [prevLength, setPrevLength] = createSignal(props.entries.length);

  createEffect(() => {
    const current = props.entries.length;
    if (current !== prevLength()) {
      setPrevLength(current);
      if (listRef?.firstElementChild) {
        listRef.firstElementChild.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  const sorted = () => [...props.entries].reverse();

  return (
    <section class="turn-log" aria-label="Turn log">
      <details class="turn-log__container" open={props.defaultOpen ?? false}>
        <summary class="turn-log__summary">Turn Log</summary>
        <div class="turn-log__body">
          <ol class="turn-log__list" ref={listRef}>
            <For each={sorted()}>
              {(entry) => (
                <li class="turn-log__entry">
                  <span class="turn-log__round">R{entry.round}</span>
                  <span class="turn-log__phase">{entry.phase}</span>
                  <span class="turn-log__message">{entry.message}</span>
                </li>
              )}
            </For>
          </ol>
        </div>
      </details>
    </section>
  );
}
