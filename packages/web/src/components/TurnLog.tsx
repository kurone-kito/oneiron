import type { LogEntry } from '@kurone-kito/oneiron-core';
import { createEffect, createSignal, For } from 'solid-js';

type Props = {
  entries: LogEntry[];
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
      <h2 class="turn-log__title">Turn Log</h2>
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
    </section>
  );
}
