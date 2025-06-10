import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { MAX_PLAYER_COUNT, MIN_PLAYER_COUNT } from '../../constants.mjs';
import { Button } from '../atoms/Button.js';
import { Checkbox } from '../atoms/Checkbox.js';
import { Select } from '../atoms/Select.js';

/** Type definition for SetupForm properties */
export interface SetupFormProps {
  readonly playerCount: number;
  readonly isAutoMode: boolean;
  readonly onPlayerCountChange: (count: number) => void;
  readonly onAutoModeChange: (auto: boolean) => void;
  readonly onStart: () => void;
}

/**
 * SetupForm component
 * @param props - Properties for the setup form component
 * @returns A SolidJS component for setting up the game
 */
export const SetupForm: Component<SetupFormProps> = (props) => {
  return (
    <div class="mb-6 p-4 bg-base-300 rounded-lg">
      <h2 class="text-xl font-semibold mb-4">ゲーム設定</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
          <label class="block text-sm font-medium text-base-content mb-2">
            プレイヤー数
          </label>
          <Select
            class="w-full"
            value={props.playerCount}
            onChange={(e) =>
              props.onPlayerCountChange(Number.parseInt(e.currentTarget.value))
            }
          >
            <For
              each={Array.from(
                { length: MAX_PLAYER_COUNT - MIN_PLAYER_COUNT + 1 },
                (_, i) => i + MIN_PLAYER_COUNT,
              )}
            >
              {(n) => (
                <option value={n} selected={n === props.playerCount}>
                  {n}人
                </option>
              )}
            </For>
          </Select>
        </div>

        <div>
          <label
            for="auto-mode"
            class="label cursor-pointer justify-start gap-2 mt-9"
          >
            <Checkbox
              checked={props.isAutoMode}
              id="auto-mode"
              onChange={(e) => props.onAutoModeChange(e.currentTarget.checked)}
            />
            <span class="text-sm font-medium text-base-content">
              自動モード
            </span>
          </label>
        </div>

        <div class="flex items-end">
          <Button class="w-full" onClick={props.onStart}>
            ゲーム開始
          </Button>
        </div>
      </div>
    </div>
  );
};
