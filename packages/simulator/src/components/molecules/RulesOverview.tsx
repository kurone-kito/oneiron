import type { Component } from 'solid-js';

/**
 * Display a brief overview of the game rules.
 * This is extracted from {@link CardGameSimulator} for clarity.
 */
export const RulesOverview: Component = () => (
  <div class="mt-6 card bg-base-300 shadow">
    <div class="card-body p-4">
      <h3 class="card-title text-lg mb-2 text-base-content">
        ゲームルール概要
      </h3>
      <ul>
        <li>三すくみ: 🔥火→🌳木→💧水→🔥火</li>
        <li>各チーム2人構成（奇数時は1人チームあり）</li>
        <li>バトル→禁止エリア→移動→復活 のフェーズを繰り返し</li>
        <li>最後まで生き残ったチームが勝利</li>
      </ul>
    </div>
  </div>
);
