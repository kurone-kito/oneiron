#!/usr/bin/env node --enable-source-maps

import { render } from 'ink';
import { createElement } from 'react';
import { App } from './App.js';

render(createElement(App));
